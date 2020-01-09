require('dotenv').config();
const http = require('https');
var emoji = require('node-emoji')
const telegram = require('node-telegram-bot-api');

const token = process.env.TELEGRAM_TOKEN;
const food_token = process.env.FOOD_API_TOKEN;

if(!token) {
    console.error('Please set TELEGRAM_TOKEN in .env');
    process.exit();
}

if(!food_token) {
    console.error('Please set FOOD_API_TOKEN in .env');
    process.exit();
}

const bot = new telegram(token, {polling: true});

function getIngredients(txt) {
    let res = emoji.unemojify(txt);
    return res.replace(/::?/g, ' ').replace(/\s\s+/g, ' ').trim().split(' ');
}

async function handleRecipeRequest(msg) {
    const chatId = msg.chat.id;
    const ingredients = getIngredients(msg.text.toString());
    console.log("Quering for: ", ingredients);
    try {
        let recipes = await getRecipes(ingredients, 3);
        for(let recipe of recipes) {
            sendSingleRecipe(chatId, recipe);
        }
    }
    catch(e) {
        console.error(e.message);
        bot.sendMessage(chatId, 'An error occured');
    }
}
function sendSingleRecipe(chatId, recipe) {
    console.log(recipe.title);
    bot.sendPhoto(chatId, recipe.image, { caption: recipe.title });
}

const recipe_url = `https://api.spoonacular.com/recipes/findByIngredients?apiKey=${food_token}`;
async function getRecipes(ingredients, amount) {
    return new Promise((resolve, reject) => {
        if(ingredients.length < 1) {
            reject(new Error("Too few ingredients"));
        }
        const ingredients_str = ingredients.join(',+');
        const url = recipe_url + "&ingredients=" + ingredients_str + "&number=" + amount;
        console.log("Quering url at: " + url);
        http.get(url, (res) => {
        const { statusCode } = res;    
        if (statusCode !== 200) {
            reject(new Error(`HTTP Request Failure (${statusCode})`));
        } 
        res.setEncoding('utf8');
        let rawData = '';
        res.on('data', (chunk) => { rawData += chunk; });
        res.on('end', () => {
          try {
            resolve(JSON.parse(rawData));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', (e) => {
        reject(e);
      });
    })
}

function main() {
    bot.on('message', handleRecipeRequest);
}


main();