/*
 * - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
 * Copyright 2025 Xyna GmbH, Germany
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
import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray, XoTransient } from '@zeta/api';
import { XoFilterInstanceArray } from './xo-filter-instance.model';
import { XoRuntimeContext } from '@fman/runtime-contexts/xo/xo-runtime-context.model';
import { XcComponentTemplate, XcTemplate } from '@zeta/xc';
import { TriggerFilterStateIconComponent } from '../state-templates/trigger-filter-state-icon.component';


@XoObjectClass(null, 'xmcp.factorymanager.filtermanager', 'Filter')
export class XoFilter extends XoObject {


    @XoProperty()
    name: string;


    @XoProperty()
    state: string;


    @XoProperty()
    @XoTransient()
    stateTemplate: XcTemplate;


    afterDecode() {
        this.stateTemplate = new XcComponentTemplate(TriggerFilterStateIconComponent, {state: this.state});
    }

    @XoProperty(XoFilterInstanceArray)
    filterInstance: XoFilterInstanceArray = new XoFilterInstanceArray();


    @XoProperty(XoRuntimeContext)
    runtimeContext: XoRuntimeContext = new XoRuntimeContext();


}

@XoArrayClass(XoFilter)
export class XoFilterArray extends XoArray<XoFilter> {
}
