import React from "react";
import _ from "lodash";

const createObjectURL = _.memoize(URL.createObjectURL);

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      recorder: null,
      recording: false,
      recordings: [],
    };
    this.webcam = null;
  }

  async newRecording() {
    const data = [];
    this.state.recorder.ondataavailable = event => data.push(event.data);
    this.state.recorder.start();
    await new Promise((resolve, reject) => {
      this.state.recorder.onstop = resolve;
      this.state.recorder.onerror = event => reject(event.name);
    });
    const recordedBlob = new Blob(data, { type: "video/webm" });
    this.setState({ recordings: this.state.recordings.concat([recordedBlob]) });
  }

  async stopRecording() {
    if (this.state.recorder.state == "recording") {
      this.state.recorder.stop()
    }
  }

  async componentDidMount() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    this.webcam.srcObject = stream;
    this.setState({ recorder: new MediaRecorder(stream) });
  }

  toggleRecording() {
    if (this.state.recording) {
      this.stopRecording();
    } else {
      this.newRecording();
    }
    this.setState({ recording: !this.state.recording });
  }

  render() {
    if (this.state.recorder) {
      document.onclick = () => this.toggleRecording();
      document.onkeypress = (e) => { if (e.key === " ") { this.toggleRecording(); } };
    }

    const [width, height] = document.body.clientWidth < document.body.clientHeight ?
      [Math.floor(document.body.clientWidth / 2), null] : [null, Math.floor(document.body.clientHeight / 2)];

    return (
      <div className="videos">
        {!this.state.recorder && <div style={{marginTop: 10}}>Waiting for webcam...</div>}
        <video
          ref={ref => this.webcam = ref}
          width={width}
          height={height}
          autoPlay
          muted
        />
        {this.state.recordings.slice().reverse().map((recording, i) => 
          <video
            key={this.state.recordings.length-i}
            src={createObjectURL(recording)}
            width={width}
            height={height}
            autoPlay
            muted
            loop
          />)}
      </div>
    );
  }
}
