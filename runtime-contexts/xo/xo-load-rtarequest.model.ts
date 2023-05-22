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
import { XoArray, XoArrayClass, XoObject, XoObjectClass, XoProperty } from '@zeta/api';

import { XoRuntimeApplication } from './xo-runtime-application.model';
import { XoWorkspace } from './xo-workspace.model';


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'LoadRTARequest')
export class XoLoadRTARequest extends XoObject {

    @XoProperty(XoRuntimeApplication)
    runtimeApplication: XoRuntimeApplication;

    @XoProperty(XoWorkspace)
    workspace: XoWorkspace;

    @XoProperty()
    documentation: string;

    @XoProperty()
    overwrite: boolean;
}


@XoArrayClass(XoLoadRTARequest)
export class XoLoadRTARequestArray extends XoArray<XoLoadRTARequest> {
}
