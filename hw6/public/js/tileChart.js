/** Class implementing the tileChart. */
class TileChart {

    /**
     * Initializes the svg elements required to lay the tiles
     * and to populate the legend.
     */
     constructor(){

        let divTiles = d3.select("#tiles").classed("content", true);
        this.margin = {top: 30, right: 20, bottom: 30, left: 50};
        //Gets access to the div element created for this chart and legend element from HTML
        let svgBounds = divTiles.node().getBoundingClientRect();
        this.svgWidth = svgBounds.width - this.margin.left - this.margin.right;
        this.svgHeight = this.svgWidth/2;
        let legendHeight = 150;
        //add the svg to the div
        let legend = d3.select("#legend").classed("content",true);

        //creates svg elements within the div
        this.legendSvg = legend.append("svg")
            .attr("width",this.svgWidth)
            .attr("height",legendHeight)
            // .attr("transform", "translate(" + this.margin.left + ",0)")
        this.svg = divTiles.append("svg")
            .attr("width",this.svgWidth)
            .attr("height",this.svgHeight)
            // .attr("transform", "translate(" + this.margin.left + ",0)")
    };

    /**
     * Returns the class that needs to be assigned to an element.
     *
     * @param party an ID for the party that is being referred to.
     */
    chooseClass (party) {
        if (party == "R"){
            return "republican";
        }
        else if (party== "D"){
            return "democrat";
        }
        else if (party == "I"){
            return "independent";
        }
    }

    /**
     * Renders the HTML content for tool tip.
     *
     * @param tooltip_data information that needs to be populated in the tool tip
     * @return text HTML content for tool tip
     */
    tooltip_render(tooltip_data) {
        let text = "<h2 class ="  + this.chooseClass(tooltip_data.winner) + " >" + tooltip_data.state + "</h2>";
        text +=  "Electoral Votes: " + tooltip_data.electoralVotes;
        text += "<ul>"
        tooltip_data.result.forEach((row)=>{
            //text += "<li>" + row.nominee+":\t\t"+row.votecount+"("+row.percentage+"%)" + "</li>"
            text += "<li class = " + this.chooseClass(row.party)+ ">" + row.nominee+":\t\t"+row.votecount+"("+row.percentage+"%)" + "</li>"
        });
        text += "</ul>";

        return text;
    }

    /**
     * Creates tiles and tool tip for each state, legend for encoding the color scale information.
     *
     * @param electionResult election data for the year selected
     * @param colorScale global quantile scale based on the winning margin between republicans and democrats
     */
    update (electionResult, colorScale){

        //Calculates the maximum number of columns to be laid out on the svg
        this.maxColumns = d3.max(electionResult,function(d){
            return parseInt(d["Space"]);
        });

        //Calculates the maximum number of rows to be laid out on the svg
        this.maxRows = d3.max(electionResult,function(d){
            return parseInt(d["Row"]);
        });

        //Creates a legend element and assigns a scale that needs to be visualized
        this.legendSvg.append("g")
            .attr("class", "legendQuantile")
            .attr("transform", "translate("+(this.svgWidth-1200)/2+",50)");

        let legendQuantile = d3.legendColor()
            .shapeWidth(100)
            .cells(10)
            .orient('horizontal')
            .scale(colorScale);

        this.legendSvg.select(".legendQuantile")
            .call(legendQuantile);

        //for reference:https://github.com/Caged/d3-tip
        //Use this tool tip element to handle any hover over the chart
        let tip = d3.tip().attr('class', 'd3-tip')
            .direction('se')
            .offset(function() {
                return [0,0];
            })
            .html((d)=>{
                // populate data in the following format
                let tooltip_data;
                if (d.I_Nominee_prop == " ") {
                    tooltip_data = {
                        "state": d.State,
                        "winner":d.State_Winner,
                        "electoralVotes" : d.Total_EV,
                        "result":[
                            {"nominee": d.D_Nominee_prop,"votecount": d.D_Votes_Total,"percentage": d.D_Percentage,"party":"D"} ,
                            {"nominee": d.R_Nominee_prop,"votecount": d.R_Votes_Total,"percentage": d.R_Percentage,"party":"R"} ,
                        ]
                    }
                } else {
                    tooltip_data = {
                        "state": d.State,
                        "winner":d.State_Winner,
                        "electoralVotes" : d.Total_EV,
                        "result":[
                            {"nominee": d.D_Nominee_prop,"votecount": d.D_Votes_Total,"percentage": d.D_Percentage,"party":"D"} ,
                            {"nominee": d.R_Nominee_prop,"votecount": d.R_Votes_Total,"percentage": d.R_Percentage,"party":"R"} ,
                            {"nominee": d.I_Nominee_prop,"votecount": d.I_Votes_Total,"percentage": d.I_Percentage,"party":"I"}
                        ]
                    }
                }
                // pass this as an argument to the tooltip_render function then,
                // return the HTML content returned from that method.
                return this.tooltip_render(tooltip_data);
            });

        // ******* TODO: PART IV *******

        let xScale = d3.scaleLinear()
            .domain([0, this.maxColumns + 1])
            .range([0, this.svgWidth])

        let yScale = d3.scaleLinear()
            .domain([0, this.maxRows + 1])
            .range([0, this.svgHeight])

        this.svg.selectAll("g").remove();
        this.svg.call(tip);

        //Tansform the legend element to appear in the center and make a call to this element for it to display.

        //Lay rectangles corresponding to each state according to the 'row' and 'column' information in the data.

        let rectgroup = this.svg.append("g")
        let rect = rectgroup.selectAll("rect")
            .data(electionResult)
        rect = rect.enter().append("rect").merge(rect)
            .attr("x", function (d) {
                return xScale(d["Space"]);
            })
            .attr("y", function (d) {
                return yScale(d["Row"]);
            })
            .attr("width", function () {
                return xScale(1);
            })
            .attr("height", function () {
                return yScale(1);
            })
            .attr("class", function (d) {
                if (d["State_Winner"] == "I")
                    return "tile independent"
                return "tile"
            })
            .attr("fill", function (d) {
                return colorScale(d["RD_Difference"]);
            })
            .on("mouseover", tip.show)
            .on("mouseout", tip.hide)

        //Display the state abbreviation and number of electoral votes on each of these rectangles

        let abbrgroup = this.svg.append("g")
            .attr("transform", "translate("+(xScale(1)/2)+", "+(yScale(1)/2)+")")
        let abbr = abbrgroup.selectAll("text")
            .data(electionResult)
        abbr = abbr.enter().append("text").merge(abbr)
            .text(function (d) {
                return d["Abbreviation"];
            })
            .attr("x", function (d) {
                return xScale(d["Space"])
            })
            .attr("y", function (d) {
                return yScale(d["Row"])
            })
            .attr("class", "tilestext")

        let evgroup = this.svg.append("g")
            .attr("transform", "translate("+(xScale(1)/2)+", "+(yScale(1)/2+24)+")")
        let ev = evgroup.selectAll("text")
            .data(electionResult)
        ev = ev.enter().append("text").merge(ev)
            .text(function (d) {
                return d["Total_EV"];
            })
            .attr("x", function (d) {
                return xScale(d["Space"])
            })
            .attr("y", function (d) {
                return yScale(d["Row"])
            })
            .attr("class", "tilestext")
        //Use global color scale to color code the tiles.

        //HINT: Use .tile class to style your tiles;
        // .tilestext to style the text corresponding to tiles

        //Call the tool tip on hover over the tiles to display stateName, count of electoral votes
        //then, vote percentage and number of votes won by each party.
        //HINT: Use the .republican, .democrat and .independent classes to style your elements.

        };


}
