function partition(array, begin, end, pivot) {
	var swaps=2;

	var piv=array[pivot];
	array.swap(pivot, end-1);
	var store=begin;
	var ix;
	for(ix=begin; ix<end-1; ++ix) {
		if(array[ix]<=piv) {
			array.swap(store, ix);
			++swaps;
			++store;
		}
	}
	array.swap(end-1, store);

	return [store,swaps];
}
Array.prototype.swap=function(a, b) {
	var tmp=this[a];
	this[a]=this[b];
	this[b]=tmp;
}
function qsort(array, begin, end) {
	var totalSwaps=0;
	if(end-1>begin) {
		var pivot=begin+Math.floor(Math.random()*(end-begin));

		var t=partition(array, begin, end, pivot);
		pivot=t[0];
		totalSwaps+=t[1];

		qsort(array, begin, pivot);
		qsort(array, pivot+1, end);
	}
	return totalSwaps;
}
function quicksort(array) {
	return qsort(array, 0, array.length);
}
