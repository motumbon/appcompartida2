// Test para vincular institución
const axios = require('axios');

async function testLinkInstitution() {
  try {
    // 1. Login para obtener token
    console.log('1. Haciendo login...');
    const loginRes = await axios.post('https://web-production-10bfc.up.railway.app/api/auth/login', {
      usernameOrEmail: 'admin', // Cambia por tu usuario
      password: 'admin123'      // Cambia por tu password
    });
    
    const token = loginRes.data.token;
    console.log('✅ Login exitoso, token obtenido');
    
    // 2. Obtener instituciones disponibles
    console.log('\n2. Obteniendo instituciones...');
    const instRes = await axios.get('https://web-production-10bfc.up.railway.app/api/institutions', {
      headers: { Authorization: `Bearer ${token}` }
    });
    
    console.log(`✅ Instituciones disponibles: ${instRes.data.length}`);
    if (instRes.data.length > 0) {
      console.log('Primera institución:', instRes.data[0]);
    }
    
    // 3. Intentar vincular primera institución
    if (instRes.data.length > 0) {
      const institutionId = instRes.data[0]._id;
      console.log(`\n3. Vinculando institución ${institutionId}...`);
      
      const linkRes = await axios.post(
        'https://web-production-10bfc.up.railway.app/api/users/institutions/link',
        { institutionId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      console.log('✅ Vinculación exitosa:', linkRes.data);
    }
    
  } catch (error) {
    console.error('\n❌ ERROR:');
    console.error('Status:', error.response?.status);
    console.error('Message:', error.response?.data?.message);
    console.error('Error:', error.response?.data?.error);
    console.error('Full response:', JSON.stringify(error.response?.data, null, 2));
  }
}

testLinkInstitution();
