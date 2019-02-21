const app = require('./src/app');

const PORT = process.env.PORT || 3000;
const serverInstance = app.listen(PORT, () => console.log(`App listening on port ${PORT}`));

module.exports = {app, serverInstance};