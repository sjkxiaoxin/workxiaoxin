export default defineAppConfig({
  pages: [
    'pages/index/index',
    'pages/create/index',
    'pages/profile/index',
    'pages/detail/index',
    'pages/team/index',
    'pages/privacy/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#fff',
    navigationBarTitleText: '工作助手小新',
    navigationBarTextStyle: 'black'
  },
  tabBar: {
    color: '#999999',
    selectedColor: '#1890ff',
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/index/index',
        text: '任务',
        iconPath: './assets/tabbar/clipboard-list.png',
        selectedIconPath: './assets/tabbar/clipboard-list-active.png'
      },
      {
        pagePath: 'pages/create/index',
        text: '创建',
        iconPath: './assets/tabbar/circle-plus.png',
        selectedIconPath: './assets/tabbar/circle-plus-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '我的',
        iconPath: './assets/tabbar/user.png',
        selectedIconPath: './assets/tabbar/user-active.png'
      }
    ]
  },
  // 录音权限声明（微信小程序必须配置，否则 RecorderManager 静默失败）
  permission: {
    'scope.record': {
      desc: '需要使用您的麦克风来录制语音任务描述'
    }
  }
})
