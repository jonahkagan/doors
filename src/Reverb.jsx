import React from "react";
import _ from "lodash";
import getBlobDuration from "get-blob-duration";

const createObjectURL = _.memoize(URL.createObjectURL);

export default class Reverb extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      recorder: null,
      recordingState: "stopped", // stopped or recording or looping
      recording: null,
      duration: null,
      mirrored: false
    };
    this.webcam = null;

    this.onKey = this.onKey.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  setUpVoiceCommands() {
    // Set up voice commands
    const commands = {
      begin: () => this.begin(),
      loop: () => this.loop(),
      blackout: () => this.reset(),
      flip: () => this.setState({ mirrored: !this.state.mirrored })
    };

    const soundAlikes = {
      luke: "loop",
      flute: "loop",
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
  }

  async startRecording() {
    const { recorder, recordings, duration } = this.state;

    const data = [];
    recorder.ondataavailable = event => {
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

    const recordedBlob = new Blob(data, { type: "video/webm" });
    if (this.state.recordingState != "stopped") {
      this.setState({
        duration: !duration ? await getBlobDuration(recordedBlob) : duration,
        recording: recordedBlob
      });
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
      this.stopRecording();
      this.setState({ recordingState: "looping" });
    }
  }

  reset() {
    this.stopRecording();
    this.setState({ recording: null, recordingState: "stopped" });
  }

  onClick() {
    this.toggleRecording();
  }

  onKey(e) {
    if (e.key === " ") {
      this.toggleRecording();
      e.preventDefault();
    } else if (e.key === "m") {
      this.setState({ mirrored: !this.state.mirrored });
    }
  }

  toggleRecording() {
    const { recordingState, duration } = this.state;
    switch (recordingState) {
      case "stopped":
        this.begin();
        break;
      case "recording":
        this.loop();
        break;
      case "looping":
        this.reset();
        break;
    }
  }

  render() {
    const { recorder, recording, recordingState, mirrored } = this.state;

    const width = Math.floor(document.body.clientWidth / 2);
    const height = Math.floor(document.body.clientHeight);
    const style = {
      width,
      height,
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      overflow: "hidden"
    };

    return (
      <div style={{ display: "flex" }}>
        {!recorder && (
          <div style={{ marginTop: 10 }}>Waiting for webcam...</div>
        )}
        <div
          style={{
            ...style,
            display: recordingState == "stopped" ? "none" : "block"
          }}
        >
          <video
            ref={ref => (this.webcam = ref)}
            height={height}
            autoPlay
            muted
          />
        </div>
        {recording && (
          <div style={{ ...style, transform: `scaleX(${mirrored ? -1 : 1})` }}>
            <video
              src={createObjectURL(recording)}
              height={height}
              onLoadedData={() => {
                if (recordingState != "stopped") {
                  this.startRecording();
                }
              }}
              autoPlay
              muted
            />
          </div>
        )}
      </div>
    );
  }
}
