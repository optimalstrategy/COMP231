import app from './app';
import Logger from './shared/logger';

// Start the server
<<<<<<< HEAD
const port = Number(process.env.PORT || 3000);
=======
const port = Number(process.env.PORT || 8080);
>>>>>>> ce70d4c... adding login page
app.listen(port, () => {
    Logger.info('Express server started on port: http://localhost:' + port);
});

