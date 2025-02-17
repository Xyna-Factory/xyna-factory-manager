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
import { XoRuntimeContext } from '@fman/runtime-contexts/xo/xo-runtime-context.model';
import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray, XoTransient } from '@zeta/api';
import { XoTriggerInstanceDetail } from './xo-trigger-instance-detail.model';
import { XcComponentTemplate, XcTemplate } from '@zeta/xc';
import { TriggerFilterStateIconComponent } from '../state-templates/trigger-filter-state-icon.component';


@XoObjectClass(null, 'xmcp.factorymanager.filtermanager', 'FilterInstanceDetails')
export class XoFilterInstanceDetails extends XoObject {


    @XoProperty()
    instance: string;


    @XoProperty(XoTriggerInstanceDetail)
    triggerInstanceDetail: XoTriggerInstanceDetail = new XoTriggerInstanceDetail();


    @XoProperty()
    filter: string;


    @XoProperty()
    description: string;


    @XoProperty(XoRuntimeContext)
    runtimeContext: XoRuntimeContext = new XoRuntimeContext();


    @XoProperty()
    status: string;


    @XoProperty()
    @XoTransient()
    stateTemplates: Array<XcTemplate>;


    afterDecode() {
        this.stateTemplates = [new XcComponentTemplate(TriggerFilterStateIconComponent, {state: this.status})];
    }


    @XoProperty()
    configurationParameter: string;


}

@XoArrayClass(XoFilterInstanceDetails)
export class XoFilterInstanceDetailsArray extends XoArray<XoFilterInstanceDetails> {
}
