import debugOg from 'debug'
const NODE_ENV = process.env.NODE_ENV
// export debug but it's only activated if __DEV__ is true
const DEBUG = [
  process.env.DEBUG,
  process.env.NEXT_PUBLIC_DEBUG,
  !NODE_ENV || NODE_ENV === 'development' || __DEV__ ? 'app:*' : '',
]
  .filter(Boolean)
  .join(',')
debugOg.enable(DEBUG)
debugOg.log('debug enabled', DEBUG)
export const debug = debugOg

export default debugOg
