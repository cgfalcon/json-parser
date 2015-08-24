/**
 *
 * A Simple Json Parser
 *
 * Created by chugang.cg on 2015/8/4.
 */

var JsonParser = (function() {

// =========================================
//     Lexer
//  Token Type: Id, Number, Str, [, ], {, }
// =========================================

    var TokenType = {
        Id: 1,
        Num: 2,
        Str: 3,
        LeftParam: 4,  // {
        RightParam: 5, // }
        LeftSqrt: 6,   // [
        RightSqrt: 7,  // ]
        Coma: 8,       // ,
        Colon: 9,      // :
        EOF: 10
    };

    var escapee = {
        '"' : '\"',
        '\\': '\\',
        '/': '/',
        b: '\b',
        f: '\f',
        t: '\t',
        n: '\n',
        r: '\r'
    };


    var EOF = '^';

    function Lexer(src) {
        this.current = 0;
        this.source = src;
        this.c = this.source.charAt(this.current);
    }

    Lexer.prototype.consume = function () {
        this.current += 1;
        if(this.current >= this.source.length) this.c = EOF;
        else this.c = this.source.charAt(this.current);
        return this.c;
    };

    Lexer.prototype.nextToken = function () {
        var token;
        while(this.c !== EOF) {
            if(isDigit(this.c) || this.c === '-') {
                return this.digit();
            } else if(this.c === '"') {
                return this.str();
            } else if(this.c === '[') {
                token = {type: TokenType.LeftSqrt, value: this.c};
                this.consume();
                return token;
            } else if(this.c === ']') {
                token = {type: TokenType.RightSqrt, value: this.c};
                this.consume();
                return token;
            } else if(this.c === '{') {
                token = {type: TokenType.LeftParam, value: this.c};
                this.consume();
                return token;
            } else if(this.c === '}') {
                token = {type: TokenType.RightParam, value: this.c};
                this.consume();
                return token;
            } else if(this.c === ':') {
                token = {type: TokenType.Colon, value: this.c};
                this.consume();
                return token;
            } else if(this.c === ',') {
                token = {type: TokenType.Coma, value: this.c};
                this.consume();
                return token;
            } else if(isWS(this.c)) {
                this.consume();
            } else if(isLetter(this.c) || this.c === '$') {
                return this.id();
            } else {
                throw new Error("Unknow Token: " + this.c + " at position: " + this.current);
            }
        }

        return {type: TokenType.EOF, value: '<EOF>'}
    };

    Lexer.prototype.tokens = function () {
        var tk = [];
        var curTk = this.nextToken();
        while(curTk.type != TokenType.EOF) {
            tk.push(curTk);
            curTk = this.nextToken();
        }
        return tk;
    };

    Lexer.prototype.id = function () {
        var result = '';
        do {
            result += this.c;
            this.consume();
        } while(isId(this.c));

        return {type: TokenType.Id, value: result}
    };

    Lexer.prototype.digit = function () {
        var result = '';
        do {
            result += this.c;
            this.consume();
        } while(isDigit(this.c));
        return {type: TokenType.Num, value: parseFloat(result)}
    };

    Lexer.prototype.str = function () {
        var result = '';
        this.consume();
        while(this.c && this.c != EOF && this.c != '"') {
            if(this.c === '\\') {
                this.consume();
                if(typeof escapee[this.c] === 'string') {
                    result += escapee[this.c];
                } else {
                    throw new Error("unknown character: " + this.c)
                }
            } else {
                result += this.c;
            }
            this.consume();
        }
        this.consume(); // consume "
        return {type: TokenType.Str, value: result};
    };

    function isId(ch) {
        return ch === '$' || isLetter(ch)  || isDigit(ch);
    }

    function isDigit(ch) {
        return '0123456789'.indexOf(ch) >= 0;
    }

    function isLetter(ch) {
        return (ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z')
    }

    function isWS(ch) {
        return ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r';
    }

///////////////////////////////////////////////
// Parser
///////////////////////////////////////////////
    function Parser(source) {
        this.lexer = new Lexer(source);
        this.tk = this.lexer.nextToken();
    }

    Parser.prototype.nextToken = function () {
        return this.lexer.nextToken();
    };

    Parser.prototype.parseObject = function () {
        var obj = {};
        this.tk = this.nextToken();
        while(this.tk.type != TokenType.RightParam) {
            if(this.tk.type === TokenType.Id ||
                this.tk.type === TokenType.Str) {
                var key = this.tk.value;
                if(this.nextToken().type != TokenType.Colon) {
                    throw new Error('unexpected token: ' + this.tk.value + ' . expected: ":"');
                }

                this.tk = this.nextToken();
                if(this.tk.type === TokenType.Id ||
                    this.tk.type === TokenType.Str ||
                    this.tk.type === TokenType.Num) {
                    // single value
                    obj[key] = this.tk.value;
                } else if(this.tk.type === TokenType.LeftParam) {
                    // object
                    obj[key] = parseObject();
                } else if(this.tk.type === TokenType.LeftSqrt) {
                    // array
                    obj[key] = parseArray();
                } else {
                    throw new Error('unexpected token: ' + this.tk.value);
                }
                this.tk = this.nextToken();

                if(this.tk.type === TokenType.Coma) {
                    this.tk = this.nextToken();
                }
            } else {
                throw new Error('unexpected token: ' + this.tk.value);
            }
        }

        return obj;
    };

    Parser.prototype.parseArray = function () {
        var arr = [];
        this.tk = this.nextToken();
        while(this.tk.type != TokenType.RightSqrt) {
            if(this.tk.type === TokenType.Id ||
                this.tk.type === TokenType.Num ||
                this.tk.type === TokenType.Str) {
                arr.push(this.tk.value);
                this.tk = this.nextToken();
            } else if(this.tk.type === TokenType.Coma) {
                this.tk = this.nextToken();
            } else {
                throw new Error('unexpected token: ' + this.tk.value)
            }
        }

        return arr;
    };

    return Parser;
})();

