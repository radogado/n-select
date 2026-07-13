(function() {
	let syncing = false;
	let currentOpenSelect = null;
	let clickOutsideSelect = (e) => {
		if (currentOpenSelect && !currentOpenSelect.dataset.nSelectAnimation && !e.target.closest(".n-select__options > *") && !e.target.closest(".n-select")) {
			closeSelect(currentOpenSelect);
		}
	};
	let closeSelectOnResizeScroll = (e) => {
		if (currentOpenSelect && (e.type === 'resize' || (e.type === 'scroll' && e.target !== currentOpenSelect))) {
			closeSelect(currentOpenSelect);
		}
	};
	const updateOptionHeight = (wrapper, select) => {
		let activeOpt = select.querySelector("[aria-selected]");
		if (activeOpt) wrapper.style.setProperty("--active-option-height", `${activeOpt.getBoundingClientRect().height}px`);
	};
	const placeSlot = (wrapper, select) => {
		updateOptionHeight(wrapper, select);
		let slot = document.createElement("span");
		slot.className = "n-select__slot";
		slot.setAttribute("aria-hidden", "true");
		slot.style.height = `${wrapper.getBoundingClientRect().height}px`;
		wrapper.insertBefore(slot, select);
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
			if (close) {
				closeSelect(select, true);
			}
		}
		updateOptionHeight(select.nuiSelectWrapper, select);
		el.style.removeProperty("--top-offset");
		el.style.removeProperty("--max-height");
		let select_native = select.nuiNativeInput;
		syncing = true;
		select_native.value = el.value;
		syncing = false;
		if (!select.nuiSuppressChange) {
			select_native.dispatchEvent(new Event("change"));
		}
		if (select.nuiOnChange) {
			select.nuiOnChange([...select.querySelectorAll("button")].indexOf(el), select_native.value);
		}
	};
	const font_properties = ["font-family", "font-size", "font-style", "font-weight", "line-height", "font-variant"];
	const setSelectExpanded = (select, expanded) => {
		const wrapper = select.nuiSelectWrapper;
		if (!wrapper) return;
		if (expanded) {
			wrapper.setAttribute("aria-expanded", "true");
			select.setAttribute("aria-expanded", "true");
		} else {
			wrapper.removeAttribute("aria-expanded");
			select.removeAttribute("aria-expanded");
		}
	};
	let closeSelect = (select, refocus = false) => {
		if (!select || !select.hasAttribute("aria-expanded")) {
			return;
		}
		const scrollY = window.scrollY;
		currentOpenSelect = null;
		delete select.dataset.nSelectAnimation;
		const wrapper = select.nuiSelectWrapper;
		if (select.contains(document.activeElement)) {
			document.activeElement.blur();
		}
		select.classList.add("n-select--closing");
		select.style.visibility = "hidden";
		updateOptionHeight(wrapper, select);
		const slot = wrapper.querySelector(".n-select__slot");
		if (slot) {
			slot.style.height = `${slot.getBoundingClientRect().height}px`;
			slot.replaceWith(select);
		} else {
			wrapper.prepend(select);
		}
		setSelectExpanded(select, false);
		font_properties.forEach((prop) => {
			select.style[prop] = "";
		});
		select.classList.remove("n-select--closing");
		select.style.visibility = "";
		wrapper.classList.remove("n-select--open");
		wrapper.style.removeProperty("--width");
		select.style.removeProperty("--scroll-help-top");
		select.style.removeProperty("--body-offset-x");
		select.style.removeProperty("--body-offset-y");
		select.classList.remove("n-select--scroll-help-top", "n-scrollbar", "n-select--crop-top");
		let selected = select.querySelector("[aria-selected]");
		if (selected) selected.tabIndex = -1;
		window.removeEventListener("resize", closeSelectOnResizeScroll);
		window.removeEventListener("scroll", closeSelectOnResizeScroll, true);
		window.removeEventListener("pointerup", clickOutsideSelect);
		select.removeEventListener("pointerup", pointerUpSelect);
		if (window.scrollY !== scrollY) {
			window.scrollTo(window.scrollX, scrollY);
		}
		if (refocus) {
			wrapper.focus({ preventScroll: true });
		}
	};
	let openSelect = (select) => {
		if (currentOpenSelect) {
			closeSelect(currentOpenSelect);
		}
		let wrapper = select.nuiSelectWrapper;
		placeSlot(wrapper, select);
		wrapper.style.setProperty("--width", `${wrapper.getBoundingClientRect().width}px`);
		wrapper.classList.add("n-select--open");
		// Fix viewport overflow
		select.style.removeProperty("--top-offset");
		select.style.removeProperty("--max-height");
		select.style.removeProperty("--select-scroll-height");
		select.style.removeProperty("--active-option-offset");
		select.classList.remove("n-select--crop-top");
		// Collapsed single-row height — must be measured before expand/portal (mask animation).
		let option_height = select.getBoundingClientRect().height;
		select.style.setProperty("--max-width", `${wrapper.getBoundingClientRect().width}px`);
		// Calculate position relative to body (where the dropdown will be appended)
		let wrapperRect = wrapper.getBoundingClientRect();
		let htmlRect = document.documentElement.getBoundingClientRect();
		let bodyRect = document.body.getBoundingClientRect();
		let bodyStyle = getComputedStyle(document.body);
		let offsetX = wrapperRect.x - htmlRect.x;
		let offsetY = wrapperRect.y - bodyRect.y;
		if (bodyStyle.position === "relative") {
			let bodyBorderLeft = parseFloat(bodyStyle.borderInlineStartWidth || 0);
			let bodyBorderTop = parseFloat(bodyStyle.borderBlockStartWidth || 0);
			offsetX -= bodyBorderLeft + bodyRect.x - htmlRect.x;
			offsetY -= bodyBorderTop;
		}
		select.style.setProperty("--body-offset-x", offsetX);
		select.style.setProperty("--body-offset-y", offsetY);
		select.querySelector("[aria-selected]").removeAttribute("tabindex");
		setSelectExpanded(select, true);
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
				let scroll_help_top = Math.min(Math.abs(cropped_space), available_top_space) - parseFloat(getComputedStyle(select).paddingInlineEnd) * 2;
				if (scroll_help_top > 0) {
					select.style.setProperty("--scroll-help-top", scroll_help_top);
					select.classList.add("n-select--scroll-help-top");
				}
			}
		}
		if (select.getBoundingClientRect().width > select.querySelector("button").getBoundingClientRect().width + parseFloat(getComputedStyle(select).paddingInlineEnd) * 2) {
			select.classList.add("n-scrollbar");
		}
		select.style.setProperty("--mask-position-y", `${active_option_offset - top_offset}`);
		select.style.setProperty("--mask-size-y", `${option_height}px`);
		window.requestAnimationFrame(() => {
			setTimeout(() => {
				select.dataset.nSelectAnimation = true;
				select.querySelector("[aria-selected]").focus({ preventScroll: true });
			}, 1);
		});
		currentOpenSelect = select;
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
			e.preventDefault();
		}
		document.body.style.pointerEvents = "none"; // Prevent iPad from clicking the element behind
		setTimeout(() => {
			document.body.style.pointerEvents = "";
		}, 100);
	};
	let timeout = null;
	let trapKeyboard = (e) => {
		if ([" ", "End", "Home", "ArrowLeft", "ArrowUp", "ArrowRight", "ArrowDown"].includes(e.key)) {
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
				closeSelect(select, true);
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
					for (let el of select.querySelectorAll("button")) {
						if (el.textContent.trim().toLowerCase().startsWith(select.nuiSearchTerm)) {
							if (select.getAttribute('aria-expanded')) {
								select.scrollTop = el.offsetTop - select.clientHeight / 2 + el.offsetHeight / 2;
								el.focus({ preventScroll: true });
							} else {
								selectOption(el, false);
							}
							break;
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
				el = document.createElement("span");
				wrapper.querySelectorAll("option").forEach((optionEl) => {
					const button = document.createElement("button");
					button.value = optionEl.value;
					button.textContent = optionEl.textContent;
					el.append(button);
				});
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
			let initial_option = el.querySelector(`button[value="${CSS.escape(initial_value)}"]`);
			if (el.nuiNativeInput.tagName === "SELECT") {
				if (el.nuiNativeInput.options.length <= 1) {
					el.nuiNativeInput.innerHTML = "";
					el.querySelectorAll("button").forEach((btn) => {
						const opt = document.createElement("option");
						opt.value = btn.value;
						opt.textContent = btn.textContent.trim();
						el.nuiNativeInput.append(opt);
					});
				}
				let richSelect = el;
				let descriptor = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value');
				Object.defineProperty(el.nuiNativeInput, 'value', {
					get() { return descriptor.get.call(this); },
					set(val) {
						descriptor.set.call(this, val);
						if (syncing) return;
						let button = richSelect.querySelector(`button[value="${CSS.escape(val)}"]`);
						if (button && !button.hasAttribute("aria-selected")) {
							richSelect.nuiSuppressChange = true;
							selectOption(button, false);
							richSelect.nuiSuppressChange = false;
						}
					}
				});
			}
			wrapper.addEventListener("pointerdown", pointerDownSelect);
			el.addEventListener("click", clickSelect); // Selects a clicked (pointer upped) option
			el.addEventListener("focusout", (e) => {
				let select = e.target.closest(".n-select__options");
				// If relatedTarget isn't a sibling, close and focus on select wrapper
				if (select.hasAttribute("aria-expanded") && !!e.relatedTarget && e.relatedTarget.parentNode !== select) {
					closeSelect(select);
				}
			});
			el.ontransitionend = (e) => {
				let el = e.target;
				el.style.removeProperty("--mask-position-y");
				el.style.removeProperty("--mask-size-y");
				delete el.dataset.nSelectAnimation;
			};
			el.addEventListener("pointerup", pointerUpSelect);
			el.addEventListener("keydown", selectKeyboard);
			wrapper.addEventListener("keydown", selectKeyboard);
			el.addEventListener("keyup", trapKeyboard);
			wrapper.addEventListener("keyup", trapKeyboard);
			el.lastElementChild.onkeydown = (e) => {
				// Close select on tab outside. To do: get last button only
				if (e.key === "Tab" && !e.shiftKey && e.target.parentNode.hasAttribute("aria-expanded")) {
					closeSelect(e.target.parentNode);
				}
			};
			el.querySelectorAll("button").forEach((el) => {
				el.type = "button"; // Unlike the default 'submit'
				el.value = el.value || el.textContent.trim();
			});
			wrapper.setAttribute("tabindex", "0");
			(el.querySelector("[aria-selected]") || el.firstElementChild).tabIndex = -1;
			wrapper.style.setProperty("--inline-width", `${el.getBoundingClientRect().width}px`);
			selectOption(el.querySelector("[aria-selected]") || initial_option || el.querySelector("button")); // Select the first option by default
			el.nuiSearchTerm = "";
			["n-select--rounded", "n-select--shadow", "n-select--checkmark"].forEach((cls) => {
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
			wrapper.setAttribute("role", "combobox");
			wrapper.setAttribute("aria-haspopup", "listbox");
			wrapper.setAttribute("tabindex", "0");
			if (!el.id) {
				el.id = `n-select-${Math.random().toString(36).slice(2, 9)}`;
			}
			wrapper.setAttribute("aria-controls", el.id);
			el.setAttribute("role", "listbox");
			el.querySelectorAll("button").forEach((btn) => {
				btn.setAttribute("role", "option");
			});
			window.requestAnimationFrame(() => {
				updateOptionHeight(wrapper, el);
				["--nui-control-color", "--nui-control-bg", "--nui-control-active-color", "--nui-control-active-bg", "--nui-control-highlight"].forEach((i) => {
					el.style.setProperty(i, wrapper.style.getPropertyValue(i));
				});
			});
		});
	};
	(typeof nui !== 'undefined' && typeof nui.registerComponent === "function") ? nui.registerComponent("n-select", init) : init(document.body);
})();