# airduct

## install

```
npm install -g airduct
```

## use
本地项目中增加 `airduct.config.js`

```
module.exports = {
        public: {
            git: '项目和配置需要更新的源git地址'
        }
}

const path = require('path');

module.exports = {
	public: {
		// 仓库拥有的配置和初始化仓库用
		git: 'init.git',
		// 组件的原始仓库
		components: '/public_components.git',
	},
	webpack: {
		title: 'wehotel',
		// zent组件别名设置
		zentAlias: function(SRC_PATH){
		    
		},
		// 依赖的组件
		imports: ["blocTree", "layout", "libs", "zent", "zentAssets", "rangePicker", "condition", "export","jwGrid", "jwPop", "chart", "auth"],
		// 覆盖webpack原始配置
		config: {
		}
	}
}


```

### 初始化项目

```
airduct init
```

### 运行编译

```
// 如需watch，使用--watch
// env不指定的情况下，通过判断当前项目是否为master分支来，确定使用怎么样的编译方式
airduct run --watch --env=production
```

### 更新相应配置

```
airduct update
```