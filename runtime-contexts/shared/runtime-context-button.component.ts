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
import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';

import { XcColor } from '@zeta/xc/shared/xc-themeable.component';

import { XoApplicationDefinition } from '../xo/xo-application-definition.model';
import { XoRuntimeContextState } from '../xo/xo-runtime-context-state.model';
import { XoRuntimeContext } from '../xo/xo-runtime-context.model';


@Component({
    selector: 'runtime-context-button',
    templateUrl: './runtime-context-button.component.html',
    styleUrls: ['./runtime-context-button.component.scss'],
    standalone: false
})
export class RuntimeContextButtonComponent {

    @Input()
    runtimeContext: XoRuntimeContext;

    @HostBinding('class.selected')
    @Input()
    selected = false;

    @Output()
    // eslint-disable-next-line @angular-eslint/no-output-native
    readonly select = new EventEmitter<XoRuntimeContext>();


    click() {
        this.select.emit(this.selected ? undefined : this.runtimeContext);
    }


    get hasIcon(): boolean {
        return this.runtimeContext.state !== XoRuntimeContextState.OK;
    }


    get color(): XcColor {
        return this.selected ? 'primary' : 'normal';
    }


    get tooltip(): string {
        if (this.runtimeContext instanceof XoApplicationDefinition && this.runtimeContext.sourceVersion) {
            return 'Source Version: ' + this.runtimeContext.sourceVersion;
        }
        return '';
    }
}
