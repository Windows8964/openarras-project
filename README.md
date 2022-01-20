# openarras-project
Open source arras server that everyone can contribute and have fun!

# How to contribute
- If you're new to github, get an account, then make a pull request with your code!
# You can host, edit or even use the code for anything!
- But, you need to make your server open source.
- If you're directly hosting the game, atleast add one single way to access the official link.

# New compiling system alert
- If youre wondering why the client isnt changing directly when you edit it, it is because you didnt compile the client yet!

# How to compile the client:
- Just simply run `npm install --force`, then run `npm run build`.
- If you do not want to run 2 commands, then just run `npm run buildRun`. This runs both "node launcher" and "npm run build" at the same time.
- If you are having problems make sure you are on the most recent version of node possible and that a folder named 'dist' exists in the main directory.
- If you contine to have problems contact an experienced contributor.
# Don't want to compile?
- In server/config.json, edit the line `COMPILED_CLIENT:` and set the boolean to false. Make sure you set it back to true after you finish your work, compile the client, and you can make your pull request as you want.
# Warning!
- While making a pull request, make sure you have compiled the client, and make sure the configuration uses the dist folder.
- If your pull request does not meet these requirements, your pull request will be declined.