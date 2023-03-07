
// Đối tượng validator
function Validator(options) {

    function getParent(element, selector) {
        while (element.parentElement) {
            if (element.parentElement.matches(selector)) {
                return element.parentElement;
            }
            element = element.parentElement;
        }
    };

    var selectorRules = {};

    // Hàm thực hiện validate
    function validate(inputElement, rule) {
        var errorMessage;

        // Lấy ra các rules của selector
        var rules = selectorRules[rule.selector];
        // console.log(rules);

        // Lặp qua từng rule và kiểm tra
        // Nếu có lỗi thì dừng kiểm tra
        for (var i = 0; i < rules.length; i++) {
            switch (inputElement.type) {
                case 'checkbox':
                case 'radio':
                    errorMessage = rules[i](
                        formElement.querySelector(rule.selector + ':checked')
                    );
                    break;
                default:
                    errorMessage = rules[i](inputElement.value);
            }
            if (errorMessage) break;
        }

        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);

        if (errorMessage) {
            errorElement.innerHTML = errorMessage;
            getParent(inputElement, options.formGroupSelector).classList.add('invalid');
        } else {
            errorElement.innerHTML = '';
            getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
        }
        return !errorMessage;
    }


    // Lấy element của form cần validate
    var formElement = document.querySelector(options.form);

    if (formElement) {

        // Khi submit form
        formElement.onsubmit = function (e) {

            e.preventDefault();

            var isFormValid = true;

            // Thực hiện lặp qua từng rule và validate
            options.rules.forEach(rule => {
                var inputElement = formElement.querySelector(rule.selector);
                var isValid = validate(inputElement, rule);
                if (!isValid) {
                    isFormValid = false;
                }
            });

            if (isFormValid) {

                // Trường hợp submit với javascript
                if (typeof options.onSubmit === 'function') {
                    var enableInputs = formElement.querySelectorAll('[name]');
                    var formValues = Array.from(enableInputs).reduce((values, input) => {
                        switch(input.type) {
                            case 'radio':
                                values[input.name] = formElement.querySelector('input[name="' + input.name + '"]:checked').value;
                                break;
                            case 'checkbox':
                                if(!input.matches(':checked')) {
                                    values[input.name] = '';
                                    return values;
                                }

                                if(!Array.isArray(values[input.name])) {
                                    values[input.name] = [];
                                }
                                values[input.name].push(input.value);
                                break;
                            case 'file':
                                values[input.name] = input.files;
                                break;
                            default: 
                                values[input.name] = input.value;
                        }
                        return values;
                    }, {});
                    options.onSubmit(formValues)
                }
                // Trường hợp submit với hành vi mặc định
                else {
                    frameElement.submit();
                }
            }
        }

        // Lặp qua mỗi rule và xử ký (lắng nghe sự kiện blur, input,...)
        options.rules.forEach(rule => {

            // Lưu lại các rules cho mỗi input
            if (Array.isArray(selectorRules[rule.selector])) {
                selectorRules[rule.selector].push(rule.test);
            } else {
                selectorRules[rule.selector] = [rule.test];
            }

            var inputElements = formElement.querySelectorAll(rule.selector);

            Array.from(inputElements).forEach(function (inputElement) {
                if (inputElement) {
                    // xử lý trường hợp blur khỏi input
                    inputElement.onblur = function () {
                        // value: inputElement.value
                        // test func: rule.test
                        validate(inputElement, rule);
                    }

                    // Xử lý mỗi khi người dùng nhập vào input
                    inputElement.oninput = function () {
                        var errorElement = getParent(inputElement, options.formGroupSelector).querySelector(options.errorSelector);
                        errorElement.innerHTML = '';
                        getParent(inputElement, options.formGroupSelector).classList.remove('invalid');
                    }
                }
            })


        });
    }
}


// Định nghĩa rules
// Nguyên tác của các rules:
// 1. Khi có lỗi => Trả ra message lỗi
// 2. Khi hợp lệ => Không trả ra cái gì cả
Validator.isRequired = function (selector) {
    return {
        selector: selector,
        test: function (value) {
            return value ? undefined : 'Vui lòng nhập trường này'
        }
    }
}

Validator.isEmail = function (selector) {
    return {
        selector: selector,
        test: function (value) {
            var regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            return regex.test(value) ? undefined : 'Trường này phải là email';
        }
    }
}

Validator.minLength = function (selector, min) {
    return {
        selector: selector,
        test: function (value) {
            return value.length >= min ? undefined : `Vui lòng nhập tối thiểu ${min} ký tự`;
        }
    }
}

Validator.isConfirm = function (selector, getConfirmValue, message) {
    return {
        selector: selector,
        test: function (value) {
            return value === getConfirmValue() ? undefined : message || 'Giá trị nhập vào không chính xác';
        }
    }
}