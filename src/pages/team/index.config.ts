export default typeof definePageConfig === 'function'
  ? definePageConfig({ navigationBarTitleText: '小队管理' })
  : { navigationBarTitleText: '小队管理' }