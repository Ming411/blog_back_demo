const express = require('express');
const {MongoClient, ObjectId} = require('mongodb');

const connenctUri = 'mongodb://localhost:27017';
const dbClient = new MongoClient(connenctUri);

const app = express();

app.use(express.json()); // 解析json格式数据，并将其挂载到req.body

app.get('/', (req, res) => {
  res.send('hello');
});
app.post('/articles', async (req, res, next) => {
  // console.log(req.body); // 必须要先通过中间件处理数据才行
  try {
    const {article} = req.body;
    if (!article || !article.title || !article.description || !article.body) {
      // 当有一项没有数据时就不给创建
      return res.status(422).json({
        error: '请求参数不符合'
      });
    }
    // 验证通过将数据写入数据库
    await dbClient.connect();
    const collection = dbClient.db('test').collection('articles');
    article.createAt = new Date();
    article.updateAt = new Date();
    const ret = await collection.insertOne(article);
    article._id = ret.insertedId;
    res.status(201).json({
      article
    });
  } catch (err) {
    // 由错误处理中间件统一处理
    next(err);
    // res.status(500).json({
    //   error: err.message
    // });
  }
});
app.get('/articles', async (req, res, next) => {
  try {
    const {_page = 1, _size = 10} = req.query;
    await dbClient.connect();
    const collection = dbClient.db('test').collection('articles');
    const ret = await collection
      .find()
      .skip(Number.parseInt((_page - 1) * _size))
      .limit(Number.parseInt(_size));
    const articles = await ret.toArray();
    const articlesCount = await collection.countDocuments();
    res.status(200).json({
      articles,
      articlesCount
    });
  } catch (err) {
    next(err);
  }
});
app.get('/articles/:id', async (req, res) => {
  try {
    await dbClient.connect();
    const collection = dbClient.db('test').collection('articles');
    const article = await collection.findOne({
      _id: ObjectId(req.params.id)
    });
    res.status(200).json({
      article
    });
  } catch (err) {
    next(err);
  }
});
app.patch('/articles/:id', async (req, res) => {
  try {
    await dbClient.connect();
    const collection = dbClient.db('test').collection('articles');
    await collection.updateOne(
      {
        _id: ObjectId(req.params.id)
      },
      {
        $set: req.body.article
      }
    );
    // 将更新后的数据重新返回
    const article = await article.findOne({_id: ObjectId(req.params.id)});
    res.status(201).json({article});
  } catch (err) {
    next(err);
  }
});
app.delete('/articles/:id', (req, res) => {
  res.send('delete /articles/:id');
});

// 所有路由的next都会经过这里
// 四个参数缺一不可，否则就会被认为是一个普通处理中间件
app.use((err, req, res, next) => {
  res.status(500).json({
    error: err.message
  });
});

app.listen(3000, () => {
  console.log('http://localhost:3000');
});
