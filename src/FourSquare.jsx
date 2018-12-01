import React from "react";
import _ from "lodash";
import getBlobDuration from "get-blob-duration";
import classNames from "classnames";
import ReactCountdownClock from "react-countdown-clock";

const createObjectURL = _.memoize(URL.createObjectURL);

export default class FourSquare extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      recorder: null,
      recordingState: "none", // none or queued or recording
      recordings: [],
      index: 0,
      duration: null,
      nextVideoStartTime: null
    };
    this.webcam = null;
    this.videos = [];

    this.onSpacebar = this.onSpacebar.bind(this);
    this.onClick = this.onClick.bind(this);
  }

  async componentDidMount() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    this.webcam.srcObject = stream;
    this.setState({ recorder: new MediaRecorder(stream) });
  }

  componentWillMount() {
    document.addEventListener("click", this.onClick);
    document.addEventListener("keydown", this.onSpacebar);
  }

  componentWillUnmount() {
    document.removeEventListener("click", this.onClick);
    document.removeEventListener("keydown", this.onSpacebar);
  }

  async startRecording() {
    const { recorder, recordings, duration, index } = this.state;

    this.setState({
      recordingState: "recording",
      nextVideoStartTime: null
    });

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
    this.setState({
      duration: !duration ? await getBlobDuration(recordedBlob) : duration,
      recordings: _.takeRight(recordings.concat([recordedBlob]), 3),
      index: (index + 1) % 4
    });
  }

  async stopRecording() {
    const { recorder } = this.state;
    if (recorder.state == "recording") {
      recorder.stop();
      this.setState({ recordingState: "none" });
    }
  }

  playVideos() {
    this.videos.forEach(v => {
      v.pause();
      v.currentTime = 0;
      v.play();
    });
    this.webcam.play();
  }

  toggleRecording() {
    const { recordingState, duration } = this.state;
    switch (recordingState) {
      case "none":
        if (this.videos.length === 0) {
          const countdown = 5 * 1000;
          this.setState({
            recordingState: "queued",
            nextVideoStartTime: Date.now() + countdown
          });
          this.timeout = setTimeout(() => {
            this.startRecording();
          }, countdown);
        } else if (!duration) {
          this.startRecording();
        } else {
          this.setState({
            recordingState: "queued",
            nextVideoStartTime: Date.now() + duration * 1000
          });
        }
        break;
      case "queued":
        if (this.timeout) {
          clearTimeout(this.timeout);
        }
        this.setState({ recordingState: "none" });
        break;
      case "recording":
        if (!duration) {
          this.stopRecording();
        }
        break;
    }
  }

  onClick() {
    this.toggleRecording();
  }

  onSpacebar(e) {
    if (e.key === " ") {
      this.toggleRecording();
      e.preventDefault();
    }
  }

  render() {
    const {
      recorder,
      recordings,
      index,
      recordingState,
      nextVideoStartTime
    } = this.state;

    const [width, height] =
      document.body.clientWidth < document.body.clientHeight
        ? [Math.floor(document.body.clientWidth / 2), null]
        : [null, Math.floor(document.body.clientHeight / 2)];

    const recorderContent = (
      <div className="recorder" key="recorder">
        <video
          ref={ref => (this.webcam = ref)}
          width={width}
          height={height}
          autoPlay
          muted
        />
        {recordingState === "queued" && (
          <div className="queuedIcon">
            <ReactCountdownClock
              seconds={(nextVideoStartTime - Date.now()) / 1000}
              color="#FF851B"
              size={30}
              weight={5}
              fontSize={40}
              showMilliseconds={false}
            />
          </div>
        )}
        {recordingState === "recording" && <div className="recordingIcon" />}
      </div>
    );

    const videos = recordings.map((recording, i) => (
      <video
        key={i}
        ref={ref => (this.videos[i] = ref)}
        src={createObjectURL(recording)}
        width={width}
        height={height}
        onLoadedData={() => {
          if (i !== 0) {
            return;
          }
          this.playVideos();
        }}
        onEnded={() => {
          if (i !== 0) {
            return;
          }
          if (recordingState === "queued") {
            this.startRecording();
          }
          this.playVideos();
        }}
        muted
      />
    ));

    return (
      <div className="videos">
        {!recorder && (
          <div style={{ marginTop: 10 }}>Waiting for webcam...</div>
        )}
        {videos
          .slice(0, index)
          .concat([recorderContent])
          .concat(videos.slice(index))}
      </div>
    );
  }
}
