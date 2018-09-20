module.exports = class UI {
    constructor(element, options, tableCols, tableRows) {
        element.innerHTML = generateHTML(options, tableCols, tableRows);
        this.options = document.getElementById("options");
        this.table = document.getElementById("table");
    }

    onOptionChange(callback) {
        this.options.addEventListener("change", function(event) {
            callback(event.target.value);
        });
    }

    setTableDisplay(shouldDisplay) {
        this.table.style.display = shouldDisplay ? "" : "none";
    }

    setRowDisplay(index, shouldDisplay) {
        table.rows[index].style.display = shouldDisplay ? "" : "none";
    }

    setCell(rowIndex, cellIndex, value) {
        table.rows[rowIndex].cells[cellIndex] = value;
    }

    generateHTML(options, tableCols, tableRows) {
        return /*html*/`
        <div class="unselectable sidenav" style="height: 500px; position: absolute; top: 0px;">
            <br>
            <div class="closebtn">✕</div>
            <div class="setting light">Select Color Source:</div>
            <select id="options" class="setting">
                ${options.map(o => `<option value=${o}>${o}</option>`)}
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
        `;
    }
}