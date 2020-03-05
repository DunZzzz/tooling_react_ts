/*
 * store.ts
 * emilien <emilien@emilien-pc>, 2019
 */

class Reducer {
	type: number;
	name: string;
	listeners: (any)[] = [];
	data: any;
	attached: ((state?: any) => any) | null = null;

	constructor(name: string, type: number) {
		console.log('Just created :', name);
		this.name = name;
		this.type = type;
		if (type === 2)
			this.data = window.localStorage.getItem(name);
	}

	listen(cb : (state : any) => any, init = false) {
		let index = this.listeners.indexOf(null);

		if (index === -1)
			index = this.listeners.push(cb) - 1;
		else
			this.listeners[index] = cb;

		if (init === true)
			cb(this.data);

		return () => {
			this.listeners[index] = null;
		};
	}

	get() {
		if (this.type === 0)
			console.error('Error: get method is incompatible with store' +
						  ' of type bridge, consider switching for a volatile' +
					  ' or permanent store');
		else
			return this.data;
	}

	dispatch(data : any) {
		if (this.type === 1)
			this.data = data;
		else if (this.type === 2)
			window.localStorage.setItem(this.name, data);
		for (let it of this.listeners) {
			if (it === null)
				continue;
			it(data);
		}
		return this;
	}

	attach(cb : (state?: any) => any, regen = true) {
		this.attached = cb;

		if (regen === true) {
			let data = cb();

			if (data instanceof Promise) {
				data.then((x) => {
					this.dispatch(x);
				}, (e) => {
					console.error(e);
				});
			} else {
				console.log(data);
				this.dispatch(data);
			}
		}
		return this;
	}

	regenerate(state : any) {
		if (this.attached) {
			let data = this.attached(state);

			if (data instanceof Promise) {
				data.then((x) => {
					this.dispatch(x);
				}, (e) => {
					console.error(e);
				});
			} else {
				console.log(data);
				this.dispatch(data);
			}
		} else {
			console.error('Ask to regenerate a null attach callback');
		}
	}
}

interface IDictionary<TValue> {
	[key: string]: TValue;
}

class Store {
	reducers : IDictionary<Reducer> = {};

	bridge(name : string) {
		let t = this.reducers[name];

		if (t && t.type !== 0)
			console.error(`Event '${ name }' has type ${ t.type } but asked for type 0`)

				return t ? t : this._createReducer(name, 0);
	}

	volatile(name : string) {
		let t = this.reducers[name];

		if (t && t.type !== 1)
			console.error(`Event '${ name }' has type ${ t.type } but asked for type 1`)
				return t ? t : this._createReducer(name, 1);
	}

	permanent(name : string) {
		let t = this.reducers[name];

		if (t && t.type !== 2)
			console.error(`Event '${ name }' has type ${ t.type } but asked for type 2`)
				return t ? t : this._createReducer(name, 2);
	}

	_createReducer(name : string, permanent : number) {
		return (this.reducers[name] = new Reducer(name, permanent));
	}

	clear(xs : Array<() => void>) {
		return () => { for (let it of xs) { it() } }
	}
}

export default new Store();
