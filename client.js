import fetch from 'node-fetch'

const baseURL = 'https://www.duchas.ie/api/v0.5'
const apiKey = "Rua2njQgwdoZ9vnRb7JTV7dfHQ4c5a"

export const getAllCounties = () => {
    return fetch(`${baseURL}/counties/?apiKey=${apiKey}`)
        .then(res => res.json())
}

export const getAllImages = (countyID) => {
    return fetch(`${baseURL}/cbeg/?CountyID=${countyID}&apiKey=${apiKey}`)
        .then(res => res.json())
}

