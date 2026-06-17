export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '创建任务'
    })
  : {
      navigationBarTitleText: '创建任务'
    }