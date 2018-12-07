# Doors

Live video looping for dance performance.

Created by [Postcompany](https://www.instagram.com/postcompany_dance/).

Play with the [demo](https://jonahkagan.github.io/doors/app.html).

## Usage

Doors was inspired by the looping pedal - a tool used by solo musicians to create layered, ensemble-like sound. Doors lets dancers loop video in real time to create ensemble-like effects in live performance.

Doors listens to voice commands so that dancers can control the looping without leaving the dance or relying on an external technician. All commands also have a keyboard equivalent.

Commands:
**"BEGIN"** _(spacebar)_: Start recording the loop
**"LOOP"** _(spacebar)_: Finish recording, playback the recorded loop. Subsequent calls of **"LOOP"** will create additional loops.
**"MIRROR"** _(m)_: Flip every other loop horizontally.
**"BLACKOUT"** _(esc)_: Stop playing all loops, reset to black emptiness.

Confused? Just play with it and it will make more sense :)

## Development

### Install dependencies

    npm install

### Run a dev server

    npm run dev-server
