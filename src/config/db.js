const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    console.log('Tentative de connexion à MongoDB Atlas...');
    
    // Mettre à jour l'URI pour spécifier la base de données MyAdminHome
    const mongoURI = process.env.MONGODB_URI.replace('test', 'MyAdminHome');
    
    const conn = await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      dbName: 'MyAdminHome' // Forcer l'utilisation de MyAdminHome
    });

    console.log('MongoDB Atlas Connected Successfully!');
    console.log('Database:', conn.connection.name);
    console.log('Host:', conn.connection.host);
  } catch (error) {
    console.error('Erreur de connexion à MongoDB Atlas:', error.message);
    process.exit(1);
  }
};

module.exports = connectDB; 