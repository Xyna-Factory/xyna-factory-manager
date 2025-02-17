/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2023 Xyna GmbH, Germany
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 */
import { Directive, ElementRef, Host, Input, OnDestroy, OnInit, Optional } from '@angular/core';

import { coerceBoolean } from '@zeta/base';


@Directive({
    // tslint:disable-next-line: directive-selector
    selector: '[fm-focus-candidate]',
    standalone: false
})
export class FMFocusCandidateDirective implements OnInit, OnDestroy {

    private readonly element: HTMLElement;

    private _ref: FMFocusCandidateRef;

    // tslint:disable-next-line: no-output-rename
    @Input('fm-focus-candidate')
    private set _refFMFocusCandidateRef(value: FMFocusCandidateRef) {
        value.setRef(this);
        this._ref = value;
    }


    private _onload = false;


    @Input('fm-focus-candidate-focus-onload')
    private set onload(value: any) {
        // this._onload = !!(value || value === '');
        this._onload = coerceBoolean(value);
    }


    constructor(@Optional() @Host() elementRef: ElementRef) {
        this.element = elementRef.nativeElement;
        if (!(this.element.tabIndex >= 0)) {
            this.element.tabIndex = -1;
        }
    }


    ngOnInit() {
        if (this._onload) {
            this.element.focus();
        }
    }


    ngOnDestroy() {
        if (this._ref) {
            this._ref.setRef(null);
        }
    }


    focus() {
        this.element.focus();
    }


    blur() {
        this.element.blur();
    }


}


export class FMFocusCandidateRef {

    private _directiveRef: FMFocusCandidateDirective;


    static getInstance(): FMFocusCandidateRef {
        return new FMFocusCandidateRef();
    }


    setRef(directive: FMFocusCandidateDirective) {
        this._directiveRef = directive;
    }


    focus() {
        if (this._directiveRef) {
            this._directiveRef.focus();
        }
    }


    blur() {
        if (this._directiveRef) {
            this._directiveRef.blur();
        }
    }

}
