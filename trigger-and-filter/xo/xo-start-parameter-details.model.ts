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
import { XoObjectClass, XoArrayClass, XoProperty, XoObject, XoArray } from '@zeta/api';


@XoObjectClass(null, 'xmcp.factorymanager.filtermanager', 'StartParameterDetails')
export class XoStartParameterDetails extends XoObject {


    @XoProperty()
    lagacyParameterCombination: string[];


    @XoProperty()
    name: string;


    @XoProperty()
    documentation: string;


    @XoProperty()
    optional: boolean;


    @XoProperty()
    mandatory: string;


    @XoProperty()
    type: string;


}

@XoArrayClass(XoStartParameterDetails)
export class XoStartParameterDetailsArray extends XoArray<XoStartParameterDetails> {
}
