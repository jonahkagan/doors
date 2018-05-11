import React from "react";
import _ from "lodash";
import getBlobDuration from "get-blob-duration";
import classNames from "classnames";
import ReactCountdownClock from "react-countdown-clock";

const createObjectURL = _.memoize(URL.createObjectURL);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      recorder: null,
      recordingState: "none", // none or queued or recording
      recordings: [],
      index: 0,
      duration: null,
      nextVideoStartTime: null,
    };
    this.webcam = null;
    this.videos = [];
  }

  async startRecording() {
    this.setState({
      recordingState: "recording",
      nextVideoStartTime: null,
    });
    const data = [];
    this.state.recorder.ondataavailable = event => {
      data.push(event.data);
      if (this.state.duration) {
        this.stopRecording();
      }
    };
    this.state.recorder.start(this.state.duration && this.state.duration * 1000);
    await new Promise((resolve, reject) => {
      this.state.recorder.onstop = resolve;
      this.state.recorder.onerror = event => reject(event.name);
      setTimeout(resolve, 60 * 1000);
    });
    const recordedBlob = new Blob(data, { type: "video/webm" });
    this.setState({
      duration: !this.state.duration ? await getBlobDuration(recordedBlob) : this.state.duration,
      recordings: _.takeRight(this.state.recordings.concat([recordedBlob]), 3),
      index: (this.state.index + 1) % 4,
    });
  }

  async stopRecording() {
    if (this.state.recorder.state == "recording") {
      this.state.recorder.stop()
    }
    this.setState({ recordingState: "none" });
  }

  async componentDidMount() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    this.webcam.srcObject = stream;
    this.setState({ recorder: new MediaRecorder(stream) });
  }

  playVideos() {
    this.videos.forEach(v => {
      v.pause();
      v.currentTime = 0;
      v.play();
    });
  }

  toggleRecording() {
    switch (this.state.recordingState) {
      case "none":
        if (!this.state.duration) {
          this.startRecording();
        } else {
          this.setState({
            recordingState: "queued",
            nextVideoStartTime: Date.now() + this.state.duration * 1000,
          });
        }
        break;
      case "queued":
        this.setState({ recordingState: "none" });
        break;
      case "recording":
        if (!this.state.duration) {
          this.stopRecording();
        }
        break;
    }
  }

  render() {
    if (this.state.recorder) {
      document.onclick = () => this.toggleRecording();
      document.onkeypress = (e) => {
        if (e.key === " ") {
          this.toggleRecording();
          e.preventDefault();
        }
      };
    }

    const [width, height] = document.body.clientWidth < document.body.clientHeight ?
      [Math.floor(document.body.clientWidth / 2), null] : [null, Math.floor(document.body.clientHeight / 2)];

    const recorder = 
      <div className="recorder" key="recorder">
        <video
          ref={ref => this.webcam = ref}
          width={width}
          height={height}
          autoPlay
          muted
        />
        {this.state.recordingState === "queued" &&
          <div className="queuedIcon">
            <ReactCountdownClock
              seconds={(this.state.nextVideoStartTime - Date.now()) / 1000}
              color="#FF851B"
              size={30}
              weight={5}
              fontSize={40}
              showMilliseconds={false}
            />
          </div>}
        {this.state.recordingState === "recording" &&
          <div className="recordingIcon" />}
      </div>;

    const videos = this.state.recordings.map((recording, i) => 
      <video
        key={i}
        ref={ref => this.videos[i] = ref}
        src={createObjectURL(recording)}
        width={width}
        height={height}
        onLoadedData={() => {
          if (i !== 0) { return }
          this.playVideos();
        }}
        onEnded={() => {
          if (i !== 0) { return }
          if (this.state.recordingState === "queued") {
            this.startRecording();
          }
          this.playVideos();
        }}
        muted
      />);

    return (
      <div className="videos">
        {!this.state.recorder && <div style={{marginTop: 10}}>Waiting for webcam...</div>}
        {videos.slice(0, this.state.index).concat([recorder]).concat(videos.slice(this.state.index))}
      </div>
    );
  }
}
