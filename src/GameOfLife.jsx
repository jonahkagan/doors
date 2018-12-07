import React from "react";
import _ from "lodash";
import getBlobDuration from "get-blob-duration";

const createObjectURL = _.memoize(URL.createObjectURL);

const SIZE = 12;

export default class GameOfLife extends React.Component {
  initState() {
    const squareSize = Math.floor(document.body.clientWidth / SIZE);
    const numRows = Math.floor(document.body.clientHeight / squareSize);
    const numCols = Math.floor(document.body.clientWidth / squareSize);
    return {
      recorder: null,
      recordingState: "stopped", // stopped or recording or looping
      iteration: 0,
      cells: _.range(numRows).map(() =>
        _.range(numCols).map(() => (Math.random() < 0.1 ? 0 : null))
      ),
      recordings: [],
      duration: null
    };
  }
  constructor(props) {
    super(props);
    this.state = this.initState();
    this.webcam = null;
    this.videos = [];
    this.onKey = this.onKey.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  setUpVoiceCommands() {
    // Set up voice commands
    const commands = {
      begin: () => this.begin(),
      loop: () => this.loop(),
      blackout: () => this.reset()
    };

    const soundAlikes = {
      luke: "loop",
      flute: "loop",
      woot: "loop",
      blue: "loop",
      bn: "begin",
      being: "begin",
      vegan: "begin",
      mirror: "flip"
    };

    const grammar = `#JSGF V1.0; grammar commands; public <command> = ${_.keys(
      commands
    ).join(" | ")}	;`;
    const recognition = new webkitSpeechRecognition();
    const grammars = new webkitSpeechGrammarList();
    grammars.addFromString(grammar, 1);
    recognition.grammars = grammars;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onresult = event => {
      const heardCommand =
        event.results[event.results.length - 1][0].transcript;
      const cleanedCommand = _.trim(_.toLower(heardCommand));
      const command = commands[cleanedCommand]
        ? cleanedCommand
        : soundAlikes[cleanedCommand];
      console.log("command", command, heardCommand);
      if (command) {
        commands[command]();
      } else {
        //this.toggleRecording();
      }
    };

    recognition.onspeechstart = () => {
      console.log("speech start");
    };
    recognition.onend = () => {
      console.log("end");
      recognition.start();
    };

    recognition.onnomatch = event => {
      console.log("nomatch", event);
    };
    recognition.onerror = event => {
      console.log("error", event);
    };

    recognition.start();
    this.recognition = recognition;
  }

  async componentDidMount() {
    // Set up webcam
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    this.webcam.srcObject = stream;
    this.setState({ recorder: new MediaRecorder(stream) });
  }

  componentWillMount() {
    document.addEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onKey);
    this.setUpVoiceCommands();
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onKey);
    this.recognition.onend = () => null;
  }

  async startRecording() {
    const { recorder, duration } = this.state;
    if (recorder.state === "recording") {
      console.log("already recording");
      return;
    }

    const data = [];
    recorder.ondataavailable = event => {
      console.log("data");
      data.push(event.data);
      if (duration) {
        this.stopRecording();
      }
    };
    recorder.start(duration && duration * 1000);

    await new Promise((resolve, reject) => {
      recorder.onstop = resolve;
      recorder.onerror = event => reject(event.name);
      setTimeout(resolve, 60 * 1000);
    });

    const { recordings, iteration, recordingState } = this.state;
    const recordedBlob = new Blob(data, { type: "video/webm" });
    console.log("recorded", recordedBlob, recordingState, iteration);
    if (recordedBlob.size === 0) {
      return;
    }
    if (recordingState == "looping") {
      recordings[iteration] = recordedBlob;
      this.setState({
        duration: !duration ? await getBlobDuration(recordedBlob) : duration,
        recordings: recordings
      });
      this.step();
    }
  }

  stopRecording() {
    const { recorder } = this.state;
    if (recorder.state == "recording") {
      recorder.stop();
    }
  }

  begin() {
    if (this.state.recordingState == "stopped") {
      this.setState({ recordingState: "recording" });
      this.startRecording();
    }
  }

  loop() {
    if (this.state.recordingState == "recording") {
      this.setState({
        recordingState: "looping"
      });
      this.stopRecording();
    }
  }

  step() {
    this.setState(state => {
      const { iteration, cells } = state;
      const newIteration = iteration + 1;
      console.log("step", newIteration);
      const newCells = cells.map((row, i) =>
        row.map((cell, j) => {
          const neighbors = [
            cells[Math.abs(i - 1)][Math.abs(j - 1)],
            cells[Math.abs(i - 1) % cells.length][j],
            cells[Math.abs(i - 1)][j],
            cells[Math.abs(i - 1)][(j + 1) % row.length],
            cells[i][Math.abs(j - 1)],
            cells[i][(j + 1) % cells.length],
            cells[(i + 1) % cells.length][Math.abs(j - 1)],
            cells[(i + 1) % cells.length][j],
            cells[(i + 1) % cells.length][(j + 1) % row.length]
          ];
          const livingNeighbors = neighbors.filter(
            neighbor => neighbor !== null
          ).length;
          if (livingNeighbors < 2 || livingNeighbors > 3) {
            return null;
          }
          return cell === null ? newIteration : iteration;
        })
      );
      this.startRecording();
      return { ...state, iteration: newIteration, cells: newCells };
    });
  }

  reset() {
    this.stopRecording();
    this.setState({ ...this.initState(), recorder: this.state.recorder });
  }

  onClick() {
    this.toggleRecording();
  }

  onKey(e) {
    switch (e.key) {
      case " ":
        this.toggleRecording();
        e.preventDefault();
        return;
      case "m":
        this.setState({ mirrored: !this.state.mirrored });
        return;
      case "Escape":
        this.reset();
    }
  }

  toggleRecording() {
    const { recordingState, duration, recorder } = this.state;
    switch (recordingState) {
      case "stopped":
        if (recorder) {
          this.begin();
        }
        break;
      case "recording":
        this.loop();
        break;
      case "looping":
        //this.loop();
        break;
    }
  }

  render() {
    const { cells, recorder, recordings, recordingState } = this.state;

    const width = Math.floor(document.body.clientWidth / SIZE);
    const height = width;
    const style = {
      width,
      height,
      overflow: "hidden",
      position: "relative"
    };
    const videoStyle = {
      position: "absolute",
      top: "-9999px",
      bottom: "-9999px",
      left: "-9999px",
      right: "-9999px",
      margin: "auto"
    };

    return (
      <div>
        {!recorder && (
          <div style={{ marginTop: 10 }}>Waiting for webcam...</div>
        )}
        <video
          ref={ref => (this.webcam = ref)}
          autoPlay
          muted
          style={{ display: "none" }}
        />
        {recorder &&
          cells.map((row, i) => (
            <div key={i} style={{ display: "flex", width: "100%" }}>
              {row.map((cell, j) => (
                <div
                  key={j}
                  style={{
                    ...style,
                    display: recordingState == "stopped" ? "none" : "block"
                  }}
                >
                  {cell == 0 && (
                    <video
                      src={createObjectURL(this.webcam.srcObject)}
                      autoPlay
                      muted
                      height={height}
                      style={videoStyle}
                    />
                  )}
                  {cell !== 0 &&
                    cell !== null && (
                      <video
                        ref={ref => (this.videos[j * SIZE + i] = ref)}
                        src={createObjectURL(recordings[cell - 1])}
                        height={height}
                        onLoadedData={() => {
                          //if (!(i === 0 && j === 0)) {
                          //  return;
                          //}
                          //this.videos.forEach(v => {
                          //  if (v) {
                          //    //v.pause();
                          //    v.currentTime = 0;
                          //    v.play();
                          //  }
                          //});
                          //this.webcam.play();
                          //if (recordingState != "stopped") {
                          //  this.startRecording();
                          //}
                        }}
                        style={videoStyle}
                        muted
                        loop
                        autoPlay
                      />
                    )}
                </div>
              ))}
            </div>
          ))}
      </div>
    );
  }
}
