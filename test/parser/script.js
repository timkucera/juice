

function parse(expression) {
    expression = expression.replace(/\s/g,'');
    var operators = {
        '==': (a,b)=>()=>a()==b(),
        '!=': (a,b)=>()=>a()!=b(),
        '>=': (a,b)=>()=>a()>=b(),
        '<=': (a,b)=>()=>a()<=b(),
        '>': (a,b)=>()=>a()>b(),
        '<': (a,b)=>()=>a()<b(),
    };
    var logic = {
        '!': (a)=>()=>!a(),
        '||': (a,b)=>()=>a()||b(),
        '&&': (a,b)=>()=>a()&&b(),
    };
    function parse_object(obj) {
        var keys = obj.split('.');
        var obj = keys.shift();
        if (obj=='this') obj = window;
        else if (obj=='parent') obj = window;
        else if (obj=='slot') obj = window;
        return ()=> {var root = window[obj];for (var k of keys) root = root[k];return root}
    }
    function split(part) {
        var par = 0;
        var terms = [];
        var term = '';
        for (var i=0;i<part.length;i++) {
            var char = part[i];
            if (char == '(') {
                if (term != '' && par == 0) {
                    terms.push(term);
                    term = '';
                }
                if (par != 0) term += char;
                par += 1;

            } else if (char == ')') {
                par -= 1;
                if (par != 0) term += char;
                if (term != '' && par == 0) {
                    terms.push(term);
                    term = '';
                }
            } else if (['&','|'].includes(char) && par == 0) {
                if (part[i+1]==char) {
                    i++;
                    if (term != '') terms.push(term);
                    terms.push(char.repeat(2));
                    term = '';
                }
            } else {
                term += char;
            }
        }
        if (terms.length == 0) {
            for (const [op,fx] of Object.entries(operators)) {
                var ab = term.split(op);
                if (ab != term) {
                    var [a,b] = ab;
                    if (op == '!' && b[0] != '=') term = logic['!'](parse_object(b));
                    else term = fx(parse_object(a),parse_object(b));
                    break;
                }
            }
            if (typeof term === 'string') term = parse_object(term);
        }
        if (term != '') terms.push(term);
        for (var t=0;t<terms.length;t++) if (typeof term === 'string' && !Object.keys(logic).includes(terms[t])){
            terms[t] = split(terms[t]);
        }
        for (var op of ['!','&&','||']) { // order determines precedence
            while (terms.includes(op)) {
                var i = terms.indexOf(op);
                if (op == '!') terms.splice(i,2,logic[op](terms[i+1]));
                else terms.splice(i-1,3,logic[op](terms[i-1],terms[i+1]));
            }
        }
        return terms[0];
    }
    return split(expression);
}

var tests = [
    'hello == world',
    'obj.foo == world',
    '(hello == world) || (foo != bar)',
    '(hello == world || (foo != bar))',
    '!(hello == world || !(foo != bar))',
    '!hello || (foo != bar) && one>two',
    '(hello == world || (foo != bar || foo>bar))'
];

for (var test of tests) {

    var hello = 1;
    var world = 2;
    var foo = 2;
    var bar = 3;
    var one = 1;
    var two = 2;
    var obj = {foo:2,bar:2};

    var fx = parse(test);
    console.log('testing: ',test);
    console.log('fx:',fx);
    console.log('result:',fx());
    console.log('eval:',eval(test));
    console.log('same?:',eval(test) == fx());
    console.log('changing...');

    var hello = 1;
    var world = 1;
    var foo = 1;
    var bar = 1;
    var one = 1;
    var two = 1;
    var obj = {foo:1,bar:1};

    console.log('result:',fx());
    console.log('eval:',eval(test));
    console.log('same?:',eval(test) == fx());
    console.log('');
}
