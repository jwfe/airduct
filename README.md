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
            git: 'xxx.git'
        }
}
```

创建项目

```
airduct --create name gitname.git
```

更新相应配置

```
airduct --update
```