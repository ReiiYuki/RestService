let RequestAsync = require(`../lib/requestasync`)
let Promise = require(`bluebird`)
let { init, reset, RestClient } = require(`../lib/RestService`)

let apiUrl = () => {
  return `http://example.com`
}

describe(`call getOptions method in restFactory`, () => {
  let request
  let path = `/testUrl`
  let method = `post`
  let body = { data: `sadsadsad` }

  beforeEach(() => {
    init({ clients: [{ type: `wongnaiTest`, url: apiUrl() }] })
    request = RestClient.wongnaiTest()
    spyOn(request, `getOptions`).and.callThrough()
  })

  afterEach(() => {
    reset()
  })

  describe(`with path, method, and body parameter`, () => {
    it(`should response object include body property`, () => {
      let result = request.getOptions(path, method, body)
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        json: true,
        body: body,
        timeout: 10000,
      }

      expect(result).toEqual(expected)
    })
  })

  describe(`without body parameter`, () => {
    it(`should response object without body property`, () => {
      let result = request.getOptions(path, method)
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        json: true,
        timeout: 10000,
      }

      expect(result).toEqual(expected)
    })
  })

  describe(`with multipart`, () => {
    it(`should response body which is array`, () => {
      let result = request.getOptions(path, method, { formData: body })
      let expected = {
        url: `${apiUrl()}${path}`,
        method: method,
        timeout: 10000,
        formData: body,
      }

      expect(result).toEqual(expected)
    })
  })
})

describe(`RestClient`, () => {
  let headers = {
    'x-forwarded-for': `HeaderValue`,
    blacklist: `xxxxxxx`,
  }
  let RestConfig = { defaultHeaders: [`x-forwarded-for`], clients: [{ type: `test1`, url: `testUrl1` }, { type: `test2`, url: `testUrl2` }] }

  afterEach(() => {
    reset()
  })

  it(`init() must create a property in RestClient and return object with some headers in whiteList header`, () => {
    init(RestConfig)
    expect(RestClient.test1).toBeDefined()

    const tmp = RestClient.test1({ headers })
    expect(tmp.headers).toEqual({ 'x-forwarded-for': `HeaderValue` })
    expect(tmp.baseApi).toEqual(RestConfig.clients[0].url)
  })
  it(`defaultHeaders should apply to all client`, () => {
    init(RestConfig)
    const test1 = RestClient.test1({ headers })
    const test2 = RestClient.test2({ headers })
    expect(test1.headers).toEqual({ 'x-forwarded-for': `HeaderValue` })
    expect(test2.headers).toEqual({ 'x-forwarded-for': `HeaderValue` })
  })
  it(`set unique header for each client`, () => {
    init({ clients: [{ type: `test`, url: `testHeaderUrl`, headers: [`TEST-HEADER`, { 'X-HEADER': 1 }] }] })
    const tmp = RestClient.test()
    expect(tmp.headers).toEqual({ 'X-HEADER': 1 })
  })
})

describe(`create request with header`, () => {
  let headers = { 'x-forwarded-for': `HeaderValue` }
  let path = `/testUrl`
  let method = `get`
  let baseUrl = apiUrl()
  let request

  beforeEach(() => {
    init({ clients: [{ type: `wongnai`, url: baseUrl, headerCfg: ['x-forwarded-for'] }] })
    request = RestClient.wongnai({ headers })
    spyOn(request, `getOptions`).and.callThrough()
  })

  afterEach(() => {
    reset()
  })

  it(`should response object with headers property when getOptions have been called`, () => {
    let expected = {
      url: `${apiUrl()}${path}`,
      method: method,
      json: true,
      headers: headers,
      timeout: 10000
    }

    let result = request.getOptions(path, method)

    expect(result).toEqual(expected)
  })
  it(`should request to RequestAsync method with headers parameter when get have been called`, () => {
    let response = {
      statusCode: 200,
      body: `res`,
    }
    let option = request.getOptions(path, `get`) // getOptions is call #1
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response))

    request.get(path) // getOptions is call #2

    expect(RequestAsync.request).toHaveBeenCalledWith(option)
    expect(RequestAsync.request).toHaveBeenCalledTimes(1)
    expect(request.getOptions).toHaveBeenCalledTimes(2)
  })
})

describe(`create new request with createRequest factory`, () => {
  let path = `/testUrl`
  let response = {
    statusCode: 200,
    body: `res`,
  }
  let request

  beforeEach(() => {
    init({ clients: [{ type: `wongnai`, url: `testUrl` }] })
    request = RestClient.wongnai()
  })

  afterEach(() => {
    reset()
  })

  it(`should call get method, and RequestAsync with correct options parameter`, () => {
    let option = request.getOptions(path, `get`)
    spyOn(request, `get`).and.callThrough()
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response))

    request.get(path)

    expect(RequestAsync.request).toHaveBeenCalledWith(option)
    expect(RequestAsync.request).toHaveBeenCalledTimes(1)
    expect(request.get).toHaveBeenCalledWith(path)
    expect(request.get).toHaveBeenCalledTimes(1)
  })
  it(`should call post method, and RequestAsync with correct option parameter`, () => {
    let body = { test: `TEXT` }
    let option = request.getOptions(path, `post`, body)
    spyOn(request, `post`).and.callThrough()
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response))

    request.post(path, body)

    expect(RequestAsync.request).toHaveBeenCalledWith(option)
    expect(RequestAsync.request).toHaveBeenCalledTimes(1)
    expect(request.post).toHaveBeenCalledWith(path, body)
    expect(request.post).toHaveBeenCalledTimes(1)
  })
})

describe(`call request method but got bad request response`, () => {
  let restClient

  beforeEach(() => {
    init({ clients: [{ type: `TEST`, url: `URL` }] })
    restClient = RestClient.TEST()
  })

  afterEach(() => {
    reset()
  })

  it(`should create Error element`, (done) => {
    let response = {
      statusCode: 400,
      body: `body`,
    }
    spyOn(RequestAsync, `request`).and.returnValue(Promise.resolve(response))

    restClient.post(`/testUrl`, {})
      .error((e) => {
        expect(e.isOperational).toEqual(true)
        expect(e.body).toEqual(response.body)
        expect(e).toEqual(jasmine.any(Error))
        done()
      })
  })
})