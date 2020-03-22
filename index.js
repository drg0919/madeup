const yargs = require('yargs');
const fs = require('fs');
const util = require('util');
const prompts = require('prompts');
const readdir = util.promisify(fs.readdir);
const rmdir = util.promisify(fs.rmdir);
const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

var argv = yargs
    .option('trto', {
        alias: 'tt',
        type: Boolean,
        desc: 'Translate from madeup language to english'
    })
    .option('trfr', {
        alias: 'tf',
        type: Boolean,
        desc: 'Translate from english to madeup language'
    })
    .option('new', {
        alias: 'n',
        type: Boolean,
        desc: 'Create new madeup language'
    })
    .argv;

const dir = `${__dirname}/langs`;
const alpha = 'abcdefghijklmnopqrstuvwxyz';

const directory = (path) => {
    if (!fs.existsSync(path))
        fs.mkdirSync(path);
}

const check = (path) => {
    if(!fs.existsSync(path))
        return false;
    return true;
}

const latestIndex = async () => {
    const files = await readdir(dir);
    return files.length>0?parseInt(files.sort()[files.length - 1].split('lang')[1])+1:1;
}

const jsonWrite = async (ind=1) => {
    var data = {};
    const res = await prompts({
        type: 'text',
        name: 'alphabet',
        message: `Enter alphabet for your language in lower case (Equivalent to a-z)`,
        validate: (val) => /^[a-z]{26}$/.test(val)&&/^(?:([a-z])(?!.*\1)){26}$/.test(val)?true:'26 unique letters not separated by anything in lower case'
    });
    const {alphabet} = res;
    alpha.split('').map((el,i) => {
        data[el] = alphabet?alphabet.split('')[i]:null;
    });
    const jsonData = JSON.stringify(data);
    await alphabet&&alphabet.split('').length===26?writeFile(`${dir}/lang${ind}/langAlpha${ind}.json`, jsonData):new Error('Sorry, something went wrong');
    console.log(`Language added. Language number is ${ind}`);
}

const cleanup = async (path) => {
    const res = await readdir(path);
    if(res.length>0)
        return;
    await rmdir(path);
    return;
}

const translate = async (path, langNum = 1, to = true) => {
        if(!path.endsWith('.txt'))
            throw new Error('File is not .txt')
        let res = await readFile(path, 'utf8');
        let alphabet = await readFile(`${dir}/lang${langNum}/langAlpha${langNum}.json`, 'utf8');
        alphabet = JSON.parse(alphabet);
        res = res.split('');
        let final;
        if(to)
            final = res.map(el => {
                if(alpha.includes(el))
                    return alphabet[el];
                return el;
            }).join('');
        else
            final = res.map(el => {
                if(alpha.includes(el))
                    return Object.keys(alphabet).find(key => alphabet[key]===el);
                return el;
            }).join('');
        resPath = `${path.split('/')[path.split('/').length - 2]}/${path.split('.txt')[0]}res.txt`;
        await writeFile(resPath, final, 'utf8');
}

const getFile = async () => {
    const path = await prompts({
        type: 'text',
        name: 'path',
        message: `Enter file path`
    });
    const lang = await prompts({
        type: 'number',
        name: 'lang',
        message: `Enter language number`
    });
    return {path,lang};
}


const main = async (args) => {
    try{if(args.new) {
        directory(dir);
        let cl;
        latestIndex().then(async res => {
            directory(`${dir}/lang${res}`);
            await jsonWrite(res);
            cl = `${dir}/lang${res}`;
            await cleanup(cl);
        });
    }
    else if(args.tf||args.tt) {
        if(check(dir)) {
            const path = await getFile();
            await translate(path.path.path,path.lang.lang,args.tf?false:true);
            console.log("Translation successful");
        }
        else {
            throw new Error('No languages added')
        }
    }
    else {
        throw new Error('No options provided');
    }}
    catch(err) {
        console.log(err.message);
        process.exit();
    }
}

main(argv);