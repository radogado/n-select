(function() {
	const isChrome = !!navigator.userAgent.match("Chrome");
	const isSafari = navigator.userAgent.match(/Safari/) && !isChrome;
	let clickOutsideSelect = (e) => {
		if (!e.target.closest(".n-select__options > *") && !e.target.closest(".n-select")) {
			document.querySelectorAll(".n-select__options[aria-expanded]:not([data-n-select-animation])").forEach((select) => {
				closeSelect(select);
			});
		}
	};
	let closeSelectOnResizeScroll = (e) => {
		let open_select = document.querySelector(".n-select__options[aria-expanded]");
		if (e.type === 'resize' || (e.type === 'scroll' && e.target !== open_select)) {
			closeSelect(open_select);
		}
	};
	const updateOptionHeight = (wrapper, select) => {
		wrapper.style.setProperty("--active-option-height", `${select.querySelector("[aria-selected]").getBoundingClientRect().height}px`);
	};
	let selectOption = (el, close = true) => {
		if (!el || el.tagName !== "BUTTON") {
			return;
		}
		let select = el.closest(".n-select__options");
		select.querySelectorAll("[aria-selected]").forEach((el) => el.removeAttribute("aria-selected"));
		el.setAttribute("aria-selected", true);
		select.nuiSelectWrapper.dataset.value = el.value;
		if (select.hasAttribute("aria-expanded")) {
			el.focus();
			if (close) {
				closeSelect(select);
			}
		}
		let options = select.children[0];
		// select.nuiSelectWrapper.style.setProperty("--active-option-height", `${el.getBoundingClientRect().height}px`);
		updateOptionHeight(select.nuiSelectWrapper, select);
		options.style.removeProperty("--top-offset");
		options.style.removeProperty("--max-height");
		let select_native = select.nuiNativeInput; // The attached native select
		select_native.innerHTML = `<option value="${el.value}"></option>`;
		const event = new Event("change");
		select_native.dispatchEvent(event);
		if (!!select.nuiOnChange) {
			select.nuiOnChange(index, select_native.value);
		}
	};
	const font_properties = ["font-family", "font-size", "font-style", "font-weight", "line-height", "font-variant"];
	let closeSelect = (select) => {
		if (!select) {
			return;
		}
		delete select.dataset.nSelectAnimation;
		// delete select.dataset.transitionend;
		select.removeAttribute("aria-expanded");
		// document.body.classList.remove("n-select--open");
		// select.style.font = "";
		font_properties.forEach((el) => {
			select.style[el] = "";
		});
		select.nuiSelectWrapper.prepend(select);
		window.removeEventListener("resize", closeSelectOnResizeScroll);
		window.removeEventListener("scroll", closeSelectOnResizeScroll);
		select.querySelector("[aria-selected]").tabIndex = -1;
		window.removeEventListener("pointerup", clickOutsideSelect);
		select.removeEventListener("pointerup", pointerUpSelect);
		let wrapper = select.parentNode;
		wrapper.classList.remove("n-select--open");
		wrapper.style.removeProperty("--width");
		select.style.removeProperty("--scroll-help-top");
		select.classList.remove("n-select--scroll-help-top");
		// window.requestAnimationFrame((t) => select.nuiSelectWrapper.focus()); // iPad blocking another element's scrolling 🤷‍♂️
		select.nuiSelectWrapper.focus();
		select.classList.remove("n-scrollbar");
	};
	let openSelect = (select) => {
		let previous_open_select = document.body.querySelector(".n-select__options[aria-expanded]");
		if (previous_open_select) {
			closeSelect(previous_open_select);
		}
		let wrapper = select.parentNode;
		updateOptionHeight(wrapper, select);
		wrapper.style.setProperty("--width", `${wrapper.getBoundingClientRect().width}px`);
		wrapper.classList.add("n-select--open");
		// Fix viewport overflow
		select.style.removeProperty("--top-offset");
		select.style.removeProperty("--max-height");
		select.style.removeProperty("--select-scroll-height");
		select.style.removeProperty("--active-option-offset");
		select.classList.remove("n-select--crop-top");
		let option_height = select.getBoundingClientRect().height;
		select.style.setProperty("--max-width", `${select.parentNode.getBoundingClientRect().width}px`);
		// If body is position relative, subtract from the vars its border width
		let document_offset = document.querySelector("html").getBoundingClientRect().x;
		select.style.setProperty("--body-offset-x", wrapper.getBoundingClientRect().x - document_offset - (document.body.style.position === "relative" ? parseFloat(getComputedStyle(document.body).borderInlineStartWidth) - document_offset + document.body.getBoundingClientRect().x : 0));
		select.style.setProperty("--body-offset-y", -document.body.getBoundingClientRect().y + wrapper.getBoundingClientRect().y - (document.body.style.position === "relative" ? parseFloat(getComputedStyle(document.body).borderBlockStartWidth) : 0));
		select.querySelector("[aria-selected]").removeAttribute("tabindex");
		select.setAttribute("aria-expanded", true);
		// select.style.font = getComputedStyle(wrapper).font; // Firefox not working
		//fontFamily fontSize, fontStyle, fontWeight
		font_properties.forEach((el) => {
			select.style[el] = getComputedStyle(wrapper)[el];
		});
		document.body.appendChild(select);
		select.style.setProperty("--select-scroll-height", `${select.getBoundingClientRect().height}px`);
		let active_option_offset = select.querySelector("[aria-selected]").getBoundingClientRect().y - select.getBoundingClientRect().y;
		let top_offset = 0;
		select.style.setProperty("--active-option-offset", active_option_offset);
		if (select.getBoundingClientRect().y < 0) {
			let current_max_height = select.getBoundingClientRect().height + select.getBoundingClientRect().y;
			select.style.setProperty("--max-height", `${current_max_height}px`);
			select.scrollTop = Math.abs(Math.round(select.getBoundingClientRect().y));
			top_offset = Math.abs(select.getBoundingClientRect().y);
			select.style.setProperty("--top-offset", top_offset);
			select.classList.add("n-select--crop-top");
			if (select.getBoundingClientRect().height > window.innerHeight) {
				select.style.setProperty("--max-height", `${current_max_height - Math.abs(window.innerHeight - select.getBoundingClientRect().height)}px`);
			}
		} else {
			if (select.getBoundingClientRect().y + select.getBoundingClientRect().height > window.innerHeight) {
				select.style.setProperty("--max-height", `${Math.abs(window.innerHeight - select.getBoundingClientRect().y)}px`);
			}
			let available_top_space = select.getBoundingClientRect().y;
			if (select.scrollHeight > select.getBoundingClientRect().height) {
				let cropped_space = select.getBoundingClientRect().height - select.scrollHeight;
				let scroll_help_top = Math.abs(Math.min(cropped_space, available_top_space)) - parseInt(getComputedStyle(select).paddingInlineEnd) * 2;
				if (scroll_help_top > 0) {
					select.style.setProperty("--scroll-help-top", scroll_help_top);
					select.classList.add("n-select--scroll-help-top");
				}
			}
		}
		if (select.getBoundingClientRect().width > select.querySelector("button").getBoundingClientRect().width + parseInt(getComputedStyle(select).paddingInlineEnd) * 2) {
			select.classList.add("n-scrollbar");
		}
		select.style.setProperty("--mask-position-y", `${active_option_offset - top_offset}`); // To do: adjust target position to equalise reveal speed on both sides: shorter side position += difference between short and long sides
		select.style.setProperty("--mask-size-y", `${option_height}px`);
		window.requestAnimationFrame((t) => {
			setTimeout(() => {
				select.dataset.nSelectAnimation = true;
				select.querySelector("[aria-selected]").focus();
				// document.body.classList.add("n-select--open");
			}, 1); // Timeout needed for the above CSS variables to work
		});
		window.addEventListener("resize", closeSelectOnResizeScroll);
		window.addEventListener("scroll", closeSelectOnResizeScroll, true);
		window.addEventListener("pointerup", clickOutsideSelect);
	};
	let nextMatchingSibling = (el, selector) => {
		let sibling = el.nextElementSibling;
		while (sibling) {
			if (sibling.matches(selector)) return sibling;
			sibling = sibling.nextElementSibling;
		}
		return false;
	};
	let previousMatchingSibling = (el, selector) => {
		let sibling = el.previousElementSibling;
		while (sibling) {
			if (sibling.matches(selector)) return sibling;
			sibling = sibling.previousElementSibling;
		}
		return false;
	};
	let clickSelect = (e) => {
		let select = e.target.closest(".n-select__options");
		let el = e.target;
		if (select.hasAttribute("aria-expanded")) {
			// Open
			if (!!el.href) {
				closeSelect(select);
			} else {
				selectOption(el);
			}
		}
	};
	let pointerDownSelect = (e) => {
		let select = e.target.closest(".n-select__options") || e.target.querySelector(".n-select__options");
		if (!!select && !select.hasAttribute("aria-expanded")) {
			// Closed
			openSelect(select);
			// Prevent the click event from closing it right away
			select.removeEventListener("click", clickSelect);
			setTimeout(() => {
				select.addEventListener("click", clickSelect);
			}, 100);
		}
	};
	let pointerUpSelect = (e) => {
		let el = e.target.closest("button");
		let select = e.target.closest(".n-select__options");
		if (!!e.target.href) {
			e.target.click();
		} else {
			if (!el || !select.hasAttribute("aria-expanded") || el.hasAttribute("aria-selected")) {
				return;
			}
			selectOption(el);
		}
		document.body.style.pointerEvents = "none"; // Prevent iPad from clicking the element behind
		setTimeout(() => {
			document.body.style.pointerEvents = "";
		}, 100);
	};
	let timeout = null;
	let trapKeyboard = (e) => {
		if ([32, 35, 36, 37, 38, 39, 40].includes(e.keyCode)) {
			// Capture Home, End, Arrows etc
			e.stopPropagation();
			e.preventDefault();
		}
	};
	let selectKeyboard = (e) => {
		if (e.target.tagName === "SELECT") {
			return;
		}
		trapKeyboard(e);
		let select = e.target.closest(".n-select__options");
		if (e.target.classList.contains("n-select")) {
			select = e.target.querySelector(".n-select__options");
		}
		if (!select) {
			return;
		}
		switch (e.key) {
			case "Enter": {
				if (e.target.classList.contains("n-select")) {
					openSelect(select);
				}
				break;
			}
			case "Escape": {
				closeSelect(select);
				break;
			}
			case "ArrowDown": {
				if (!select.hasAttribute("aria-expanded")) {
					openSelect(select);
				} else {
					let sibling = nextMatchingSibling(e.target, "button, a[href]");
					if (sibling) {
						sibling.focus();
					} else {
						select.querySelector("button").focus();
					}
				}
				break;
			}
			case "ArrowUp": {
				if (!select.hasAttribute("aria-expanded")) {
					openSelect(select);
				} else {
					let sibling = previousMatchingSibling(e.target, "button, a[href]");
					if (sibling) {
						sibling.focus();
					} else {
						let options = select.querySelectorAll("button");
						options[options.length - 1].focus();
					}
				}
				break;
			}
			case "Home": {
				select.querySelector("button").focus();
				break;
			}
			case "End": {
				select.querySelector("button:last-of-type").focus();
				break;
			}
			default: {
				// Filter options by text entered by keyboard
				select.nuiSearchTerm += e.key.toLowerCase();
				clearTimeout(timeout);
				timeout = setTimeout(() => {
					// select the option that starts with select.nuiSearchTerm
					for (let el of select.querySelectorAll("button")) {
						if (el.textContent.trim().toLowerCase().startsWith(select.nuiSearchTerm)) {
							if (select.getAttribute('aria-expanded')) {
								el.focus();
							} else {
								selectOption(el, false);
							}
						}
					}
					select.nuiSearchTerm = "";
				}, 200);
			}
		}
		return false;
	};
	let init = (host) => {
		if (!window.PointerEvent) {
			// CSS-only fallback when Pointer Events aren't supported
			return;
		}
		host.querySelectorAll(".n-select:not([data-ready])").forEach((el) => {
			let wrapper = el;
			if (el.tagName === "SELECT") {
				return;
			}
			el = el.querySelector(".n-select__options"); // Work with the inner wrapper
			if (!el) {
				let options = "";
				wrapper.querySelectorAll("option").forEach((el) => {
					options += `<button value="${el.value}">${el.textContent}</button>`;
				});
				el = document.createElement("span");
				el.insertAdjacentHTML("beforeend", options);
				wrapper.prepend(el);
			}
			el.nuiSelectWrapper = wrapper;
			el.classList.add("n-select__options");
			el.nuiNativeInput = el.nuiSelectWrapper.querySelector("select, input") || nextMatchingSibling(el.nuiSelectWrapper, "select") || document.querySelector(`[data-n_select="${el.nuiSelectWrapper.dataset.n_select}"]`); // As a sibling, child or data-n_select match (where data-n_select is the rich select's data-n_select attribute)
			if (!el.nuiNativeInput) {
				// Missing native select, so generate it
				let input = document.createElement("select");
				input.name = input.id = el.dataset.name;
				wrapper.append(input);
				el.nuiNativeInput = input;
			}
			let initial_value = el.nuiNativeInput.value;
			let initial_option = el.querySelector(`button[value="${initial_value}"`);
			el.nuiNativeInput.innerHTML = "";
			wrapper.addEventListener("pointerdown", pointerDownSelect);
			el.addEventListener("click", clickSelect); // Selects a clicked (pointer upped) option
			el.addEventListener("focusout", (e) => {
				let select = e.target.closest(".n-select__options");
				// If relatedTarget isn't a sibling, close and focus on select wrapper
				if (select.hasAttribute("aria-expanded") && !!e.relatedTarget && e.relatedTarget.parentNode !== select) {
					closeSelect(select);
					select.nuiSelectWrapper.focus();
				}
			});
			el.ontransitionend = (e) => {
				let el = e.target;
				el.style.removeProperty("--mask-position-y");
				el.style.removeProperty("--mask-size-y");
				delete el.dataset.nSelectAnimation;
				el.addEventListener("pointerup", pointerUpSelect);
				// el.dataset.transitionend = true;
			};
			el.addEventListener("keydown", selectKeyboard);
			wrapper.addEventListener("keydown", selectKeyboard);
			el.addEventListener("keyup", trapKeyboard);
			wrapper.addEventListener("keyup", trapKeyboard);
			el.lastElementChild.onkeydown = (e) => {
				// Close select on tab outside. To do: get last button only
				if (e.key === "Tab" && !e.shiftKey && e.target.parentNode.hasAttribute("aria-expanded")) {
					closeSelect(e.target.parentNode);
					e.target.parentNode.nuiSelectWrapper.focus();
				}
			};
			el.querySelectorAll("button").forEach((el) => {
				el.type = "button"; // Unlike the default 'submit'
				el.value = el.value || el.textContent.trim();
			});
			wrapper.setAttribute("tabindex", 0);
			(el.querySelector("[aria-selected]") || el.firstElementChild).tabIndex = -1;
			wrapper.style.setProperty("--inline-width", `${el.getBoundingClientRect().width}px`);
			selectOption(el.querySelector("[aria-selected]") || initial_option || el.querySelector("button")); // Select the first option by default
			el.nuiSearchTerm = "";
			["n-select--rounded", "n-select--shadow"].forEach((cls) => {
				if (wrapper.classList.contains(cls)) {
					el.classList.add(cls);
				}
			});
			let label = el.closest("label") || document.querySelector(`label[for="${el.nuiNativeInput.id}"]`);
			if (label) {
				label.onclick = (e) => {
					let el = e.target;
					if (!el.closest(".n-select")) {
						e.preventDefault();
						el = el.closest("label");
						let select = el.querySelector(".n-select") || document.getElementById(el.getAttribute("for")).closest(".n-select");
						select.focus();
					}
				};
			}
			wrapper.dataset.ready = true;
			window.requestAnimationFrame(() => {
				// wrapper.style.setProperty("--active-option-height", `${el.querySelector("[aria-selected]").getBoundingClientRect().height}px`);
				updateOptionHeight(wrapper, el);
				["--nui-control-color", "--nui-control-bg", "--nui-control-active-color", "--nui-control-active-bg", "--nui-control-highlight"].forEach((i) => {
					el.style.setProperty(i, wrapper.style.getPropertyValue(i));
				});
			});
		});
	};
	(typeof nui !== 'undefined' && typeof nui.registerComponent === "function") ? nui.registerComponent("n-select", init) : init(document.body);
})();