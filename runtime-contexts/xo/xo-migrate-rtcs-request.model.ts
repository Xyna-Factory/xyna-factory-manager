// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
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

import { MigrationObject } from '../dialog/migrate-wizard/migrate-wizard.component';
import { XoRTCMigration, XoRTCMigrationArray } from './xo-rtcmigration.model';


@XoObjectClass(null, 'xmcp.factorymanager.rtcmanager', 'MigrateRTCsRequest')
export class XoMigrateRTCsRequest extends XoObject {
    @XoProperty(XoRTCMigrationArray)
    rTCMigration: XoRTCMigrationArray = new XoRTCMigrationArray();

    @XoProperty()
    abortProblemeticOrders: boolean;

    constructor(_ident?: string, migrationlist: MigrationObject[] = [], abortProblematicOrders = false) {
        super(_ident);
        this.abortProblemeticOrders = abortProblematicOrders;
        migrationlist.forEach(object => {
            this.rTCMigration.append(new XoRTCMigration(undefined, object.source, object.target, object.node));
        });
    }
}

@XoArrayClass(XoMigrateRTCsRequest)
export class XoMigrateRTCsRequestArray extends XoArray<XoMigrateRTCsRequest> {}
