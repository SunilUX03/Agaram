# Trying other design files locally

Nothing here touches GitHub or the live site. Work in a separate clone on your own computer.

## One-time setup

```bash
git clone https://github.com/SunilUX03/Agaram.git agaram-lab
cd agaram-lab
npm install
npm run lab:setup
```

`lab:setup` tags today's version as `baseline` and turns off pushing in this clone.

## Try a design file

```bash
git checkout -b exp/my-design baseline
npm run dev          # open http://localhost:5173
```

Put the design `.md` in the branch, restyle from it, look in the browser. One branch per design (`exp/airbnb`, `exp/carbon`, ...). Switch with `git checkout exp/<name>`.

Colours, fonts, radius, spacing and shadows are tokens and `src/styles/app.css`, so most restyling is quick. Swapping UX4G for another component library is a much bigger job.

## Complete reset

```bash
npm run reset            # back to baseline; experiment branches are kept
npm run reset -- --all   # back to baseline and delete every exp/* branch
```

To remove one experiment: `git branch -D exp/<name>`.

## Safety

- `git remote -v` should show `DISABLED` as the push address.
- The `baseline` tag marks the version everyone agreed was good. Do not move it.
