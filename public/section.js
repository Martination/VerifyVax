//
// Custom control that creates a section for display
//
//  Button  ? (toggles collapsable document fields)
//  TextArea[0]
//  [TextArea[n]]  Optional additional textareas
//  TextArea (collapsable error textarea toggled by content)
//


class Field {

    section;
    textArea;
    name;
    errors = [];
    height = { min: 60, max: 400 };
    options = { color: { default: "#FFF", update: "#d6fcd7" }, delay: { update: 100, bounce: 100 } };

    constructor(section, name, placeholder) {

        this.section = section;
        this.name = name;
        this.textArea = document.createElement("TEXTAREA");
        this.textArea.setAttribute("placeholder", placeholder);
        this.textArea.setAttribute("aria-labelledby", this.section.button.id);

        section.sectionValue.appendChild(this.textArea);

        let timer;

        this.textArea.addEventListener("input", () => {

            console.log("Input changed");
            document.getElementById("summaryWorking").value = "Processing";
            window.validateCode("summaryWorking");

            // this will prevent typing from triggering a server round-trip for every key-stroke
            if (timer) clearTimeout(timer);

            timer = setTimeout(this.update.bind(this), this.options.delay.bounce, timer);

        });
    }

    async update(timer) {

        timer = undefined;

        // Special handling if field is made empty
        // remove errors and clear the remaining sections
        if (this.textArea.value.trim() === "") {
            this.textArea.value = "";
            this.section.fields.length > 1 ?
                this.section.clearErrors(this.index) :
                this.section.clearErrors();
            this.section.next?.clear();
            return;
        }

        await this.section.validate(this);
    }


    set placeholder(text) {
        this.textArea.setAttribute("placeholder", text);
    }

    get index() {
        return this.section.fields.findIndex(e => e === this);
    }

    get value() {
        return this.textArea.value.trim();
    }

    set value(text) {
        this.textArea.value = text || "";
        if (this.textArea === "") this.errors = [];
        this.textArea.style.background = this.options.color.update;
        setTimeout(() => {
            this.textArea.style.background = this.options.color.default;
        }, this.options.delay.update);
    }

    get errors() {
        return this.errors;
    }

    set errors(errorArray) {
        this.this.errors = errorArray || [];
    }

    valid() {
        return this.value.length && !this.errors.some(err => err.level > 2);
    }

    delete() {
        this.section.sectionValue.removeChild(this.textArea.parentElement);
        this.textArea.parentElement.remove();
        this.textArea.remove();
        this.section.fields.splice(this.index, 1);
    }

}


class Section {

    button = undefined;
    next = undefined;
    fields = [];
    errors = [];
    taError;
    docLeft;
    docRight;
    id;
    sectionValue;


    constructor(id, buttonText) {

        this.id = id;

        // <div class="section">
        const sectionDiv = document.getElementById(id);
        sectionDiv.className = "section pb-4";

        if (buttonText) {
            // <input type="button" ...
            this.button = document.createElement("INPUT");
            this.button.setAttribute("type", "button");
            this.button.className = "btn btn-secondary btn-lg mb-2";
            this.button.id = id + "Button";
            this.button.value = buttonText || "Button";
            sectionDiv.appendChild(this.button);
            this.button.onclick = this.process.bind(this);
        }

        //<input type="button" class="info collapsible"
        const infoButton = document.createElement("INPUT");
        infoButton.setAttribute("type", "button");
        infoButton.className = "info collapsible fs-6 btn-dark m-1 border border-0";
        infoButton.value = "  ?  ";
        infoButton.setAttribute("tabindex", "0");
        sectionDiv.appendChild(infoButton);

        // <div id="docsDecodeJWS" class="docs"></div>
        const docsDiv = document.createElement("DIV");
        docsDiv.setAttribute("id", "docs" + id);
        docsDiv.style = "display: flex;";
        docsDiv.className = "content mb-2";
        sectionDiv.appendChild(docsDiv);

        var markdownLeftDiv = document.createElement("DIV");
        markdownLeftDiv.style = "width: 50%;padding-right: 5px;";
        docsDiv.appendChild(markdownLeftDiv);

        this.docLeft = document.createElement("article");
        this.docLeft.className = "markdown-body";
        this.docLeft.innerHTML = "docHtml";
        markdownLeftDiv.appendChild(this.docLeft);

        var markdownRightDiv = document.createElement("DIV");
        markdownRightDiv.style = "flex-grow: 1;padding-left: 5px;";
        docsDiv.appendChild(markdownRightDiv);

        this.sectionValue = document.createElement("DIV");
        sectionDiv.appendChild(this.sectionValue);

        // <span class="error collapsible"></span>
        const errorSpan = document.createElement("SPAN");
        errorSpan.className = "error collapsible";
        sectionDiv.appendChild(errorSpan);

        // <div id="docsDecodeJWS" class="docs"></div>
        const errorDiv = document.createElement("DIV");
        errorDiv.className = "content";
        sectionDiv.appendChild(errorDiv);

        //  <textarea class="taError" id="taJWSPayloadError"></textarea>
        this.taError = document.createElement("TEXTAREA");
        this.taError.className = "taError";
        this.taError.readOnly = true;
        this.taError.placeholder = "No errors";
        this.taError.setAttribute("id", "ta" + id + "Error");
        this.taError.setAttribute("wrap", "off");
        errorDiv.appendChild(this.taError);

        this.info = infoButton;

        this.info.addEventListener("click", () => {
            var docsBody = this.info.nextElementSibling;
            if (docsBody.style.maxHeight) {
                docsBody.style.maxHeight = null;
            } else {
                docsBody.style.maxHeight = docsBody.scrollHeight + "px";
            }
        });

        return;
    }


    // Sets text in the collapsable Error field. Field will collapse when empty
    // Label allows errors to be put into groups
    setErrors(errors, index = -1) {

        // convert strings to error objects
        for (let i = 0; i < errors.length; i++) {
            if (typeof (errors[i]) === "string") {
                errors[i] = { message: errors[i], code: 100, level: 3 };
            }
        }

        if (index >= 0) {
            this.fields[index].errors = errors;
        } else {
            this.errors = errors;
        }

        this.displayErrors();

        return errors.length > 0;
    }


    // Sets text in the collapsable Error field. Field will collapse when empty
    // Specify label to clear only errors of that group. Use no label to clear everything
    clearErrors(index = -1) {

        if (index >= 0) {
            this.fields[index].errors = [];
        } else {
            this.errors = [];
            this.fields.forEach(f => f.errors = []);
        }

        this.displayErrors();
    }


    displayErrors() {

        const allErrors = [];
        const errorLabels = ["Debug", "Info", "Warning", "Error", "Fatal"];

        const element = this.taError;
        let errors = false;

        const height = { min: 60, max: 400 };

        this.fields.forEach(f => f.errors.forEach(e => {
            allErrors.push(`· ${e.message} (${errorLabels[e.level]})`);
            errors = errors || e.level > 2;
        }));

        this.errors.forEach(e => {
            allErrors.push(`· ${e.message} (${errorLabels[e.level]})`)
            errors = errors || e.level > 2;
        });

        if (allErrors.length === 0) {
            element.value = "";
            element.parentElement.style.maxHeight = null;
            return;
        }

        element.value = allErrors.join("\n");
        element.style.background = errors ? "#e097a2" : "#f7ca6b";


        // expand the error TA and parent DIV elements
        element.style.height = "1px";
        element.style.maxHeight = height.max + "px";
        element.style.height = Math.max(element.scrollHeight, height.min) + 5 + "px";
        element.parentElement.style.maxHeight = "max-content";
    }


    // Sets the collapsable documentation sections left, right
    // accepts text as markdown and converts it to formatted html
    setDocs(markdownLeft, markdownRight) {

        if (markdownLeft && markdownLeft.trim().length) {
            this.docLeft.innerHTML = markdownLeft;

            if (!markdownRight) {
                // span left across 100%
                this.docLeft.parentElement.style = "width: 100%;";
                const rightDiv = this.docLeft.parentElement.nextElementSibling;
                this.docLeft.parentElement.parentElement.removeChild(rightDiv);
                return;
            }
        }

        if (markdownRight && markdownRight.trim().length) {

            if (this.docRight == null) {
                this.docRight = document.createElement("article");
                this.docRight.className = "markdown-body";
                this.docLeft.parentElement.nextElementSibling.appendChild(this.docRight);
            }

            this.docRight.innerHTML = markdownRight;
        }

    }


    // Adds additional text fields below the default text field
    // The new field can be accessed by this.fields[i] or this.values[id]
    addTextField(placeholder, name) {
        this.fields.push(new Field(this, name, placeholder));
    }


    // Reset to single TA
    resetTextFields() {
        for (let i = 1; i < this.fields.length;) {
            this.fields[1].delete();        // I think this needs to be [i] not [1]?
        }
    }


    // Gets the value of a field by id or the first field
    getValue(index = 0) {
        return this.fields[index].value;
    }


    // Sets the value of a field by id or the first field
    async setValue(value, index = 0) {
        const field = this.fields[index];

        if (!field) throw new Error(`setValue() cannot lookup field[${index}].`);

        field.value = value;
        await field.update();
    }


    // Clear all fields
    clear() {
        this.clearErrors();
        this.fields.forEach(f => f.value = undefined);
        if (this.next) this.next.clear();
        else clearDataExtract();
        // This is called twice before processing begins each time, for some reason
    }


    // returns true if each field has data, but there are no errors.
    valid() {
        if (this.fields.some(field => !field.valid())) return false;

        if (this.errors.some(err => err.level > 2)) return false;

        return true;
    }


    // Triggers the button on the next section if .next is assigned
    goNext() {
        if (!this.next) return;

        setTimeout(async () => {
            await this.next.process(); //.button.onclick();
        }, 0);
    }


    // Calls into the overridden process function
    async process() {
        await this.process();
    }


    // Calls into the overridden validate function
    async validate() {
        await this.validate(this.fields[0]);
    }

}
