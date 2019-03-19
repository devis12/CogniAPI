const app = require('./src/app'); // app logic implemented by the express server

const PORT = process.env.PORT || 3000;
const serverInstance = app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

module.exports = {app, serverInstance};