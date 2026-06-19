export default typeof definePageConfig === 'function'
  ? definePageConfig({
      navigationBarTitleText: '工作助手小新'
    })
  : {
      navigationBarTitleText: '工作助手小新'
    }