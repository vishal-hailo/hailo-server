import axios from 'axios';

const url = 'https://api.hailone.in/ondc/search';
console.log('Hitting: ' + url);

axios.post(url, { latitude: 19.076, longitude: 72.877 })
    .then(res => {
        console.log('Local Search Response:', res.data);
        return new Promise(resolve => setTimeout(() => resolve(res.data.transactionId), 2000));
    })
    .then(txnId => {
        return axios.get(`https://api.hailone.in/ondc/results/${txnId}`)
            .then(res => console.log(`Results for ${txnId}:`, res.data))
            .catch(err => console.error(err.response?.data || err.message));
    })
    .catch(err => console.error(err.message));
