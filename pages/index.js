import axios from 'axios';

export default function Home({ data }) {
  return (
    <div>
      <h1>Bem-vindo à API Defesa Civil</h1>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}

export async function getServerSideProps() {
  try {
    const response = await axios.get('http://localhost:3000/');
    return {
      props: {
        data: response.data,
      },
    };
  } catch (error) {
    return {
      props: {
        data: 'Erro ao obter dados da API',
      },
    };
  }
}
