import isPlainObject from 'is-plain-obj';
import {STANDARD_STREAMS_ALIASES} from '../utils.js';

export const normalizeFdSpecificOptions = options => {
	const optionBaseArray = Array.from({length: getStdioLength(options)});

	const optionsCopy = {...options};
	for (const optionName of FD_SPECIFIC_OPTIONS) {
		const optionArray = normalizeFdSpecificOption(options[optionName], [...optionBaseArray], optionName);
		optionsCopy[optionName] = addDefaultValue(optionArray, optionName);
	}

	return optionsCopy;
};

const getStdioLength = ({stdio}) => Array.isArray(stdio)
	? Math.max(stdio.length, STANDARD_STREAMS_ALIASES.length)
	: STANDARD_STREAMS_ALIASES.length;

const FD_SPECIFIC_OPTIONS = ['maxBuffer'];

const normalizeFdSpecificOption = (optionValue, optionArray, optionName) => isPlainObject(optionValue)
	? normalizeOptionObject(optionValue, optionArray, optionName)
	: optionArray.fill(optionValue);

const normalizeOptionObject = (optionValue, optionArray, optionName) => {
	for (const [fdName, fdValue] of Object.entries(optionValue)) {
		for (const fdNumber of parseFdName(fdName, optionName, optionArray)) {
			optionArray[fdNumber] = fdValue;
		}
	}

	return optionArray;
};

const parseFdName = (fdName, optionName, optionArray) => {
	const fdNumber = parseFd(fdName);
	if (fdNumber === undefined || fdNumber === 0) {
		throw new TypeError(`"${optionName}.${fdName}" is invalid.
It must be "${optionName}.stdout", "${optionName}.stderr", "${optionName}.all", or "${optionName}.fd3", "${optionName}.fd4" (and so on).`);
	}

	if (fdNumber >= optionArray.length) {
		throw new TypeError(`"${optionName}.${fdName}" is invalid: that file descriptor does not exist.
Please set the "stdio" option to ensure that file descriptor exists.`);
	}

	return fdNumber === 'all' ? [1, 2] : [fdNumber];
};

export const parseFd = fdName => {
	if (fdName === 'all') {
		return fdName;
	}

	if (STANDARD_STREAMS_ALIASES.includes(fdName)) {
		return STANDARD_STREAMS_ALIASES.indexOf(fdName);
	}

	const regexpResult = FD_REGEXP.exec(fdName);
	if (regexpResult !== null) {
		return Number(regexpResult[1]);
	}
};

const FD_REGEXP = /^fd(\d+)$/;

const addDefaultValue = (optionArray, optionName) => optionArray.map(optionValue => optionValue === undefined
	? DEFAULT_OPTIONS[optionName]
	: optionValue);

const DEFAULT_OPTIONS = {
	maxBuffer: 1000 * 1000 * 100,
};