/*
LICENSE: GNU General Public License v3.0.
YEAR: 2020
COPYRIGHT HOLDER: Kieran Walsh

GNU General Public License v3.0. The mapper 1d, 2d and cutoff functions by
Kieran Walsh are direct JavaScript translations of Paul Pearson's R code versions -
the following was included in this R code.

    LICENSE: GNU General Public License v3.0.
    YEAR: 2015
    COPYRIGHT HOLDER: Paul Pearson

    GNU General Public License v3.0.  The mapper1D function by Paul
    Pearson is a cleaned-up, modified, and ported version of the Mapper 
    code by Daniel Muellner and Gurjeet Singh originally written for Matlab.
    What follows is the copyright notice included in the Matlab code written 
    by Muellner, based on code written by Singh.

        This is a cleaned-up and modified version of the Mapper code by
        Gurjeet Singh. It also corrects two bugs which are present in the
        original Mapper code.
        (c) 2010 Daniel Muellner, muellner@math.stanford.edu
        Copyright: As far as Daniel Muellner's contributions are concerned,
        this code is published under the GNU General Public License v3.0
        (see http://www.gnu.org/licenses/gpl.html). For scientific citations,
        please refer to my home page http://math.stanford.edu/~muellner. If
        you visit this page in the future, chances are high that you will find
        a Python library with improved, largely extended and freely
        distributable Mapper code there.
        Since the present code is based on Gurjeet Singh's original code,
        please also respect his copyright message.
        Below is the original copyright message:
        Mapper code -- (c) 2007-2009 Gurjeet Singh
        This code is provided as is, with no guarantees except that
        bugs are almost surely present.  Published reports of research
        using this code (or a modified version) should cite the
        article that describes the algorithm:
        G. Singh, F. Memoli, G. Carlsson (2007).  Topological Methods for
        the Analysis of High Dimensional Data Sets and 3D Object
        Recognition, Point Based Graphics 2007, Prague, September 2007.
        Comments and bug reports are welcome.  Email to
        gurjeet@stanford.edu.
        I would also appreciate hearing about how you used this code,
        improvements that you have made to it, or translations into other
        languages.
        You are free to modify, extend or distribute this code, as long
        as this copyright notice is included whole and unchanged.
*/

function cluster_cutoff_at_first_empty_bin(heights, diam, num_bins_when_clustering) {
    //if there are only two points (one height value), then we have a single cluster
    if (heights.length == 1) {
        if (heights == diam) {
            return Infinity;
        }
    }

    //Determine bin breaks
    
    let bins_start = Math.min(...heights);
    let bins_end = diam;
    let bin_size = (bins_end - bins_start)/num_bins_when_clustering;

    let bin_breaks = new Array(num_bins_when_clustering+1);
    for(let i=0, j=bins_start; i<num_bins_when_clustering+1; i++, j+=bin_size) {
        bin_breaks[i] = j;
    }

    //Initiallize bins
    let bins = new Array(num_bins_when_clustering).fill(0);

    //Populate bins (could be improved using binary search - also heights could be non-decreasing)
    for(let i=0; i<heights.length; i++) {
        for(let j=1; j<bin_breaks.length; j++) {
            if(heights[i] <= bin_breaks[j]) {
                bins[j-1]++;
                break;
            }
        }
    }

    //Get first empty bin (last is excluded - in original code this is done by including diam in heights)
    for(let i=0; i<bins.length-1; i++) {
        if(bins[i] == 0) {
            let val = (bin_breaks[i] + bin_breaks[i+1]) / 2.0;
            return val;
        }
    }
    return Infinity;
}