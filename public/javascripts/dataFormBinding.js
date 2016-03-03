/**
 * Created by Matthieu on 22/12/2015.
 */

(function dataFormBinding(){

    /**
     * Get the value stored at 'attr' in an object 'obj'
     * @param obj   The object where 'attr' should be
     * @param attr The path to attribute, can be composite (e.g myObject.mySubobject.attr)
     * @returns {*} The value if attr exists, undefined otherwise
     */
    function getValue(obj, attr){
        var attrs = attr.split('.');
        while(attrs.length > 0){
            var a = attrs.shift();
            obj = obj[a];
            if(obj === undefined) return undefined;
        }
        return obj;
    }

    /**
     * Set the value 'val' at 'obj[attr]'
     * @param obj   The object where 'obj[attr]' will contain 'val'
     * @param attr The path to attribute, can be composite (e.g myObject.mySubobject.attr)
     * @param val   The value to set at obj[attr]
     */
    function setValue(obj, attr, val){
        var attrs = attr.split('.');
        while(attrs.length > 0){
            var a = attrs.shift();
            if(obj[a] === undefined){
                //if next one is a number, then a is an array
                if(isNaN(Number(attrs[0]))){
                    obj[a] = {};
                }else{
                    obj[a] = [];
                }
            }

            if(attrs.length == 0){
                obj[a] = val;
            }else{
                obj = obj[a];
            }
        }
    }

    /**
     *  Initialise a new listener for a given object. Takes obj and attr
     *  as parameters. When the handleInput is called (when a change has occurred)
     *  it will update obj[attr] with the new value retrieved from the html element
     * @param obj       The object to fill
     * @param attr      The attribute of the object
     * @returns {function} event handle for addEventListener
     */
    function initListener(obj, attr){
        return function (event){
            var src = event.target || event.srcElement;
            switch(src.localName.toLowerCase()){
                case 'input':
                    var val;
                    switch(src.type){
                        case 'number':
                            val = Number(src.value);
                            break;
                        case 'checkbox':
                            val = src.checked;
                            break;
                        case 'radio':
                        case 'text' :
                        default:
                            val = src.value;
                            break;
                    }

                    setValue(obj, attr, val);
                    break;
                case 'select':
                    setValue(obj, attr, src[src.selectedIndex].value);
                    break;
                case 'textarea':
                    setValue(obj, attr, src.value);
                    break;
                default:
                    console.log('Unknown element');
                    console.log(event);
            }
        };
    }

    /**
     * Set default parameter for a given input. obj[attr] should contain
     * the value to be injected in the input
     * @param input
     * @param {object} obj
     * @param {string} attr
     */
    function injectDefault(input, obj, attr){
        var val = getValue(obj, attr);
        if(val === undefined) return;

        switch(input.localName.toLocaleLowerCase()){
            case 'input':
                switch(input.type){
                    case 'checkbox':
                        input.checked = val;
                        break;
                    case 'radio':
                        if(input.value === val){
                            input.checked = true;
                        }
                        break;
                    default:
                        input.value = val;
                        break;
                }
                break;
            case 'select':
                for(var i = 0; i < input.childElementCount; i++){
                    if(input[i].value === val){
                        input.selectedIndex = i;
                        break;
                    }
                }
                break;
            case 'textarea':
                input.value = val;
                break;
            default:
                console.log('Unknown element');
                console.log(input);
        }
    }

    // select all bind-obj attributes
    var form = document.querySelectorAll('[bind-obj]');

    // for each of them, select all bind-val attributes
    for(var i = 0; i < form.length; i++){
        // if the object to be bind with does not exist yet,
        // create an empty one
        var objName = form[i].getAttribute("bind-obj");
        if(!window[objName]){
            window[objName] = {};
        }

        var bindVal = form[i].querySelectorAll('[bind-val]');
        for(var j = 0; j < bindVal.length; j++){
            var objAttr = bindVal[j].getAttribute("bind-val");
            //inject default if any
            injectDefault(bindVal[j], window[objName], objAttr);
            bindVal[j].addEventListener('change', initListener(window[objName], objAttr), false);
        }
    }
})();

