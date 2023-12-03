const express = require('express')
const path = require('path')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const dbPath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())

let db = null
const intializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}

intializeDBAndServer()

//Returns a list of all todos whose status is 'TO DO'
app.get('/todos/', async (request, response) => {
  const {status = '', priority = '', search_q = ''} = request.query
  const getQuery = `
    SELECT
        *
    FROM
      todo
    WHERE
      CASE
        WHEN (('${priority}' <> '${''}') AND ('${status}' <> '${''}')) THEN (todo LIKE '%${search_q}%' AND status = '${status}' AND priority = '${priority}')
        WHEN ('${priority}' <> '${''}') THEN (todo LIKE '%${search_q}%' AND priority = '${priority}')
        WHEN ('${status}' <> '${''}') THEN (todo LIKE '%${search_q}%' AND status = '${status}')
        ELSE (todo LIKE '%${search_q}%')
      END;`
  const resArr = await db.all(getQuery)
  response.send(resArr)
})

//Returns a specific todo based on the todo ID
app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`
  res = await db.get(query)
  response.send(res)
})

//Create a todo in the todo table
app.post('/todos/', async (request, response) => {
  const cr = request.body
  const query = `
    INSERT INTO
      todo (todo, priority, status)
    VALUES
      ('${cr.todo}', '${cr.priority}', '${cr.status}');`
  const dbResponse = await db.run(query)
  response.send('Todo Successfully Added')
})

//Updates the details of a specific todo based on the todo ID
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const toupdate = request.body
  const {status, priority, todo} = toupdate
  const query = `
    UPDATE
      todo
    SET
      ${Object.keys(toupdate)[0]} =
        CASE
          WHEN ('${status !== undefined}') THEN ('${status}')
          WHEN ('${priority !== undefined}') THEN ('${priority}')
          WHEN ('${todo !== undefined}') THEN ('${todo}')
        END
    WHERE
      id = ${todoId};`
  await db.run(query)
  if (status){
    response.send('Status Updated')
  } else if (priority){
    response.send('Priority Updated')
  } else if (todo){
    response.send('Todo Updated')
  }
})

//Deletes a todo from the todo table based on the todo ID
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const query = `
    DELETE FROM
      todo
    WHERE
      id = ${todoId};`
  await db.run(query)
  response.send('Todo Deleted')
})

module.exports = app
