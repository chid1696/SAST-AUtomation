const debounce=function (fn, delay) {
    var timer = null;

    return function () {
        var context = this, args = arguments;
        clearTimeout(timer);
        timer = setTimeout(function () {
            fn.apply(context, args);
        }, delay);
    };
};

const validateapply=function (fn) {

    return function () {
        var context = this, args = arguments;
        fn.apply(context, args);
    };
};

function CustomDateComponent() {
}

CustomDateComponent.prototype.init = function (params) {
    var template ="<label class='cusDateReset'>x</label><input type='text' class='cusDate' placeholder='mm/dd/yyyy' maxLength='10' style='width:100%'>";

    this.params = params;

    this.eGui = document.createElement('div');
    this.eGui.className = 'filter ';
    this.eGui.innerHTML = template;

    this.eDate = this.eGui.querySelector('.cusDate');
	this.eDateReset = this.eGui.querySelector('.cusDateReset');
	
	$(this.eDate).mask('00/00/0000');
	
	$(this.eGui.querySelector('.cusDate')).datepicker({
				format: 'mm/dd/yyyy',
				autoclose: true,
				classes:"ag-custom-component-popup"})
				.on('changeDate', this.onDateChanged.bind(this, 'cusDate'))
			  .on('show', function(e){ 
          var datepickerDropDown = $('.datepicker');
          datepickerDropDown.addClass("ag-custom-component-popup");
		    });
		
    this.eDate.addEventListener('input', this.onDateInput.bind(this, 'cusDate'));
	this.eDateReset.addEventListener('click', this.onResetDate.bind(this, 'cusDate'));

    this.date = null;
};

CustomDateComponent.prototype.getGui = function () {
    return this.eGui;
};


CustomDateComponent.prototype.onResetDate = function () {
    this.setDate(null);
    this.params.onDateChanged();
};

CustomDateComponent.prototype.onDateInput = debounce(ValidateDateInput, 300);

CustomDateComponent.prototype.onDateChanged = validateapply(ValidateDateInput);

CustomDateComponent.prototype.getDate = function () {
    return this.date;
};

CustomDateComponent.prototype.setDate = function (date) {
    if (!date) {
        this.eDate.value = '';
        this.date = null;
    } else {
		let disDay = date.getDate()>9?date.getDate():"0"+date.getDate();
		let disMonth = (date.getMonth()+1)>9?date.getMonth()+1:"0"+(date.getMonth()+1);
        this.eDate.value = disMonth+"/"+disDay+"/"+date.getFullYear();
        this.date = date;
    }
};

//*********************************************************************************
//          INTERNAL LOGIC
//*********************************************************************************

CustomDateComponent.prototype.parseDate = function (cusDate) {
    //If any of the three input date fields are empty, stop and return null
    if (cusDate.trim() === '' || !isValidDate(cusDate)) {
        return null;
    }

    let day = Number(cusDate.split('/')[1]);
    let month = Number(cusDate.split('/')[0]);
    let year = Number(cusDate.split('/')[2]);

    let date = new Date(year, month - 1, day);

    //If the date is not valid
    if (isNaN(date.getTime())) {
        return null;
    }

    //Given that new Date takes any garbage in, it is possible for the user to specify a new Date
    //like this (-1, 35, 1) and it will return a valid javascript date. In this example, it will
    //return Sat Dec 01    1 00:00:00 GMT+0000 (GMT) - Go figure...
    //To ensure that we are not letting non sensical dates to go through we check that the resultant
    //javascript date parts (month, year and day) match the given date fields provided as parameters.
    //If the javascript date parts don't match the provided fields, we assume that the input is nonsensical
    // ... ie: Day=-1 or month=14, if this is the case, we return null
    //This also protects us from non sensical dates like dd=31, mm=2 of any year
    if (date.getDate() !== day || date.getMonth() + 1 !== month || date.getFullYear() !== year) {
        return null;
    }

    return date;
};


function isValidDate(s) {
    // Assumes s is "mm/dd/yyyy"
    if ( ! /^\d\d\/\d\d\/\d\d\d\d$/.test(s) ) {
        return false;
    }
    const parts = s.split('/').map((p) => parseInt(p, 10));
    parts[0] -= 1;
    const d = new Date(parts[2], parts[0], parts[1]);
    return d.getMonth() === parts[0] && d.getDate() === parts[1] && d.getFullYear() === parts[2];
}

function ValidateDateInput()
{
	if(!this.eDate.value)
	{
		this.setDate(null);
		this.params.onDateChanged();
		return false;
	}

	if(this.eDate.value.length==10)
	{
		this.date = this.parseDate(
			this.eDate.value
		);
		if(!this.date)
			this.setDate(null);
		this.params.onDateChanged();
	}
}