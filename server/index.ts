import app from './app';
import Logger from './shared/logger';


// Start the server
const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
    Logger.info('Express server started on port: http://localhost:' + port);
});
