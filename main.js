require("dotenv").config();
const http = require("https");
process.env.NTBA_FIX_319 = 1;
const TelegramBot = require("node-telegram-bot-api");

var emoji = require("node-emoji");

const token = process.env.TELEGRAM_TOKEN;
const food_token = process.env.FOOD_API_TOKEN;

const db = require("better-sqlite3")("gustavo.db");

db.exec(
  "CREATE TABLE IF NOT EXISTS requests (user INTEGER NOT NULL, request TEXT NOT NULL, timestamp DATETIME DEFAULT CURRENT_TIMESTAMP NOT NULL)"
);

const get_last_requests = db.prepare(
  "SELECT * FROM requests WHERE user=? AND DATE(timestamp) = DATE('now')"
);
const insert_request = db.prepare(
  "INSERT INTO requests (user, request) VALUES(?, ?)"
);

if (!token) {
  console.error("Please set TELEGRAM_TOKEN in .env");
  process.exit();
}

if (!food_token) {
  console.error("Please set FOOD_API_TOKEN in .env");
  process.exit();
}

const bot = new TelegramBot(token, { polling: true });

function getIngredients(txt) {
  let res = emoji.unemojify(txt);
  return res.replace(/::?/g, " ").replace(/\s\s+/g, " ").trim().split(" ");
}

const maxRequestPerDay = 4;

async function handleRecipeRequest(msg) {
  const chatId = msg.chat.id;

  if (msg.text == "/start") {
    bot.sendMessage(
      chatId,
      "Hey there! It´s me, Gustavo!\nWhat do you want to cook today?\n🥕🍅🥑"
    );
    return;
  }

  let requests = get_last_requests.all(chatId);

  if (
    requests.length >= maxRequestPerDay &&
    !(process.env.DEV_CHATID && process.env.DEV_CHATID == chatId)
  ) {
    bot.sendMessage(
      chatId,
      "Sorry, you exceeded your number of request per day. Come back tomorrow!"
    );
    return;
  }

  const ingredients = getIngredients(msg.text.toString());

  insert_request.run(chatId, msg.text.toString());

  console.log("Quering for: ", ingredients);

  try {
    const response = await getRecipes(ingredients, 3);
    const recipes = response.results;
    for (let recipe of recipes) {
      sendSingleRecipe(chatId, recipe);
    }
    if (recipes.length == 0) {
      bot.sendMessage(chatId, "Oh noo! No recipes found.");
    }
  } catch (e) {
    console.error(e.message);
    bot.sendMessage(chatId, "I am sorry, something went wrong.");
  }
}
function sendSingleRecipe(chatId, recipe) {
  console.log(recipe.title);
  const info = `⏱ ${recipe.readyInMinutes}min`;
  const message = `<a href="${recipe.sourceUrl}">${recipe.title}</a>\n${info}`;
  bot.sendPhoto(chatId, recipe.image, { caption: message, parse_mode: "HTML" });
}

const recipe_url = `https://api.spoonacular.com/recipes/complexSearch?apiKey=${food_token}`;
async function getRecipes(ingredients, amount) {
  return new Promise((resolve, reject) => {
    if (ingredients.length < 1) {
      reject(new Error("Too few ingredients"));
    }
    const ingredients_str = ingredients.join(",+");
    const url =
      recipe_url +
      "&includeIngredients=" +
      ingredients_str +
      "&number=" +
      amount +
      "&addRecipeInformation=true" +
      "&sort=random";

    console.log("Quering url at: " + url);
    http
      .get(url, (res) => {
        const { statusCode } = res;

        if (statusCode !== 200) {
          reject(new Error(`HTTP Request Failure (${statusCode})`));
        }
        res.setEncoding("utf8");
        let rawData = "";
        res.on("data", (chunk) => {
          rawData += chunk;
        });
        res.on("end", () => {
          try {
            resolve(JSON.parse(rawData));
          } catch (e) {
            reject(e);
          }
        });
      })
      .on("error", (e) => {
        reject(e);
      });
  });
}

function main() {
  console.log("Running Gustavo ...");
  bot.on("message", handleRecipeRequest);
}

main();
