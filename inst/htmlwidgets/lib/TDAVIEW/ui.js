class menu {
	constructor(element) {
		element.innerHTML = this.generateHTML();
	}

	generateHTML() {
		return /*html*/`
        <div class="unselectable sidenav" style="height: 500px; position: absolute; top: 0px;">
            <br>
            <div class="closebtn">✕</div>
            <div class="setting light">Select Color Source:</div>
            <select id="options" class="setting">
                <option value="x">x</option>
                <option value="y">y</option>
            </select>
            <br>
            <div class="setting light">Node label as:</div>
            <select class="setting">
                <option value="name">Name</option>
                <option value="size">Size</option>
                <option value="none">None</option>
            </select>
            <br>
            <a class="button setting light" value="Export Graph">Export Graph</a>
            <select id="selectorExport" class="setting">
                <option value="JPEG">JPEG</option>
                <option value="PNG">PNG</option>
            </select>
            <br>
        </div>`/*
            <div class="setting light">Selected Node:</div>
            <table id="table" style="display: none;">
            <thead>
                <tr>
                    ${options.map(o => `<th>${o}</th>`)}
                </tr>
            </thead>
            <tbody>
                ${("<tr>" + "<td></td>".repeat(tableCols) + "</tr>").repeat(tableRows)};
            </tbody>
            </table>
        </div>
        `*/;
	}


}

