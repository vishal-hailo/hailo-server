const store = new Map()

export const saveTransaction = (txnId, data) => {

  store.set(txnId, data)

}

export const getTransaction = (txnId) => {

  return store.get(txnId)

}